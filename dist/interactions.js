"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleButtonInteraction = exports.handleNewGame = exports.displayUserStats = exports.displayLeaderboard = void 0;
const discord_js_1 = require("discord.js");
const users_1 = require("./users");
const game_1 = require("./game");
const embeds_1 = require("./embeds");
// displays leaderboard
async function displayLeaderboard(interaction) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle("Rock Paper Scissors Leaderboard 👑")
        .setDescription((0, users_1.getLeaderboard)())
        .setFooter({
        text: "Only users who have interacted with the bot are shown.",
    });
    await interaction.reply({ embeds: [embed], components: [] });
}
exports.displayLeaderboard = displayLeaderboard;
// displays a user's stats
async function displayUserStats(interaction) {
    const targetUserId = interaction.options.get("user")?.value;
    const targetUser = (0, users_1.getUser)(targetUserId);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`${targetUser.username}'s Stats 📊`)
        .setDescription(`Stats for <@${targetUserId}>`)
        .setFields({ name: "Points 🚀", value: `${targetUser.points} pts` }, { name: "Win Streak 🔥", value: `${targetUser.streak}` }, { name: "Wins", value: `${targetUser.wins}`, inline: true }, { name: "Losses", value: `${targetUser.losses}`, inline: true }, { name: "W/L Ratio", value: `${targetUser.ratio}`, inline: true });
    await interaction.reply({ embeds: [embed], components: [] });
}
exports.displayUserStats = displayUserStats;
// handles command calls for new games
async function handleNewGame(interaction, gameType) {
    // start a new game against the cpu
    if (gameType === "CPU") {
        const playerId = interaction.user.id;
        const session = (0, game_1.startSession)(gameType, playerId);
        await interaction.reply((0, embeds_1.embedSessionInProgress)(session));
    }
    // send a match offer to another user
    else {
        const senderId = interaction.user.id;
        const recieverId = interaction.options.get("opponent")
            ?.value;
        const wager = interaction.options.get("wager")?.value ?? 0;
        // prevent user from playing against the bot
        if (recieverId === "1236885244032978965") {
            await interaction.reply({
                content: "You cannot request a match against the bot.",
                ephemeral: true,
            });
            return;
        }
        else {
            (0, users_1.initUser)(recieverId, interaction.options.get("opponent")?.user?.globalName);
        }
        // prevent user from playing against themselves
        if (senderId === recieverId) {
            await interaction.reply({
                content: "You cannot request a match against yourself.",
                ephemeral: true,
            });
            return;
        }
        // prevent negative wagers
        if (wager < 0) {
            await interaction.reply({
                content: `You cannot request a match with a negative wager (${wager}).`,
                ephemeral: true,
            });
            return;
        }
        // prevent user from wagering more than they or their opponent have
        const sender = (0, users_1.getUser)(senderId);
        const reciever = (0, users_1.getUser)(recieverId);
        if (wager > sender.points || wager > reciever.points) {
            await interaction.reply({
                content: `You (${sender.points}) or your opponent (${reciever.points}) do not have enough points to make this wager (${wager}).`,
                ephemeral: true,
            });
            return;
        }
        // if all safeguards are passed, send an offer
        const offer = (0, game_1.startOffer)(senderId, recieverId, wager);
        await interaction.reply((0, embeds_1.embedPendingOffer)(offer));
    }
}
exports.handleNewGame = handleNewGame;
// handles button interactions
async function handleButtonInteraction(interaction, instanceId, choice) {
    // handle game choices
    if (["Rock", "Paper", "Scissors"].includes(choice)) {
        const userId = interaction.user.id;
        const sessionId = instanceId;
        const session = (0, game_1.getSession)(sessionId);
        if ((0, game_1.authenticateSession)(userId, session)) {
            (0, game_1.progressSession)(session, choice);
            if (session.turn === "result") {
                await interaction.update((0, embeds_1.embedSessionResult)(session));
            }
            else {
                await interaction.update((0, embeds_1.embedSessionInProgress)(session));
            }
        }
        else {
            await interaction.reply({
                content: "You cannot make this game decision.",
                ephemeral: true,
            });
        }
    }
    // handle offers
    else if (["Accept", "Decline"].includes(choice)) {
        const userId = interaction.user.id;
        const offerId = instanceId;
        const offer = (0, game_1.getOffer)(offerId);
        if ((0, game_1.authenticateOffer)(userId, offer)) {
            // offer accepted, start a new game
            if (choice === "Accept") {
                const session = (0, game_1.processOffer)(offer, "Accept");
                await interaction.update((0, embeds_1.embedSessionInProgress)(session));
            }
            // offer declined
            else {
                (0, game_1.processOffer)(offer, "Decline");
                await interaction.update((0, embeds_1.embedDeclinedOffer)(offer));
            }
        }
        else {
            await interaction.reply({
                content: `Only <@${offer.recipient.id}> can accept/decline this offer.`,
                ephemeral: true,
            });
        }
    }
}
exports.handleButtonInteraction = handleButtonInteraction;
