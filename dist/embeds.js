"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedSessionResult = exports.embedSessionInProgress = exports.embedDeclinedOffer = exports.embedPendingOffer = void 0;
const discord_js_1 = require("discord.js");
const game_1 = require("./game");
const choices = {
    Rock: "🪨",
    Paper: "📄",
    Scissors: "✂️",
};
function createOfferButtons(offerId) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`${offerId}_Accept`)
        .setLabel("Accept")
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId(`${offerId}_Decline`)
        .setLabel("Decline")
        .setStyle(discord_js_1.ButtonStyle.Danger));
}
function createSessionButtons(sessionId) {
    const buttons = new discord_js_1.ActionRowBuilder();
    Object.keys(choices).forEach((choice) => {
        buttons.addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`${sessionId}_${choice}`)
            .setLabel(`${choice} ${choices[choice]}`)
            .setStyle(discord_js_1.ButtonStyle.Primary));
    });
    return buttons;
}
function getPlayerTag(player) {
    return player.id === "CPU" ? "CPU" : `<@${player.id}>`;
}
function getChoiceDisplay(player) {
    return `**${getPlayerTag(player)}'s Choice:** ${player.choice} ${choices[player.choice]}`;
}
function getPointDisplay(player) {
    const trend = player.pointDifference?.[0];
    const emoji = trend === "+" ? " 📈" : trend === "-" ? " 📉" : "";
    return `${player.stats.points} (${player.pointDifference})${emoji}`;
}
function getResultDisplay(session) {
    const { player1, player2 } = session;
    if (session.type === "CPU") {
        switch (player2.result) {
            case "Tie":
                return `You tied.`;
            case "Win":
                return `You win! ✓`;
            default:
                return `You lose... ✗`;
        }
    }
    else {
        switch (player2.result) {
            case "Tie":
                return `${player1.stats.username} and ${player2.stats.username} Tied.`;
            default:
                return `${(0, game_1.getWinner)(session).stats.username} Wins! ✓`;
        }
    }
}
function getResultFields(session) {
    const { player1, player2 } = session;
    if (session.type === "CPU") {
        return [
            {
                name: `Your Points`,
                value: getPointDisplay(player2),
            },
            {
                name: "Wins",
                value: `${player2.stats.wins}`,
                inline: true,
            },
            {
                name: "Losses",
                value: `${player2.stats.losses}`,
                inline: true,
            },
            {
                name: "Streak",
                value: `${player2.stats.streak}`,
                inline: true,
            },
        ];
    }
    else {
        const wagerResult = player1.result === "Tie"
            ? `${session.wager} pts Returned to Each Player`
            : `${session.wager * 2} pts Awarded to <@${(0, game_1.getWinner)(session).id}>\n${session.wager} pts Deducted from <@${(0, game_1.getLoser)(session).id}>`;
        return [
            {
                name: "Wager Result",
                value: wagerResult,
            },
            {
                name: `${player1.stats.username}'s Points`,
                value: getPointDisplay(player1),
            },
            {
                name: `${player2.stats.username}'s Points`,
                value: getPointDisplay(player2),
            },
        ];
    }
}
function embedPendingOffer(offer) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle("New Match Offer!")
        .setDescription(`Sender: <@${offer.sender.id}>\nRecipient: <@${offer.recipient.id}>`)
        .addFields({ name: "Wager", value: `${offer.wager}` })
        .setFooter({ text: "Accept offer? ⚔️" });
    return { embeds: [embed], components: [createOfferButtons(offer.id)] };
}
exports.embedPendingOffer = embedPendingOffer;
function embedDeclinedOffer(offer) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle("Match Offer Declined ✗")
        .setDescription(`<@${offer.recipient.id}> Declined <@${offer.sender.id}>'s Match Offer for ${offer.wager} pts! 🤷`);
    return { embeds: [embed], components: [] };
}
exports.embedDeclinedOffer = embedDeclinedOffer;
function embedSessionInProgress(session) {
    const reciever = session[session.turn];
    const opponent = session[session.turn === "player1" ? "player2" : "player1"];
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`${reciever.stats.username}'s Turn!`)
        .setDescription(`**Opponent**: ${getPlayerTag(opponent)}`)
        .addFields({
        name: "Points",
        value: `${reciever.stats.points} pts`,
        inline: true,
    });
    if (session.type === "PVP")
        embed.addFields({ name: "Wager Pot", value: `${session.wager * 2}` });
    return { embeds: [embed], components: [createSessionButtons(session.id)] };
}
exports.embedSessionInProgress = embedSessionInProgress;
function embedSessionResult(session) {
    const { player1, player2 } = session;
    const displayResult = getResultDisplay(session);
    const displayChoices = `${getChoiceDisplay(player1)}\n${getChoiceDisplay(player2)}`;
    const fields = getResultFields(session);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(displayResult)
        .setDescription(displayChoices)
        .addFields(fields);
    return { embeds: [embed], components: [] };
}
exports.embedSessionResult = embedSessionResult;
