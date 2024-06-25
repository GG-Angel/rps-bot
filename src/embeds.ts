import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { Offer, Player, Session, getLoser, getWinner } from "./game";

const choices: { [key: string]: string } = {
  Rock: "🪨",
  Paper: "📄",
  Scissors: "✂️",
};

function createOfferButtons(offerId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${offerId}_Accept`)
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${offerId}_Decline`)
      .setLabel("Decline")
      .setStyle(ButtonStyle.Danger)
  );
}

function createSessionButtons(
  sessionId: string
): ActionRowBuilder<ButtonBuilder> {
  const buttons = new ActionRowBuilder<ButtonBuilder>();
  Object.keys(choices).forEach((choice) => {
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId(`${sessionId}_${choice}`)
        .setLabel(`${choice} ${choices[choice]}`)
        .setStyle(ButtonStyle.Primary)
    );
  });
  return buttons;
}

function createRematchButton(
  sessionId: string
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${sessionId}_Rematch`)
      .setLabel("Rematch")
      .setStyle(ButtonStyle.Secondary)
  );
}

function getPlayerTag(player: Player): string {
  return player.id === "CPU" ? "🤖 CPU" : `<@${player.id}>`;
}

function getPings(instance: Offer | Session): string {
  if ("sender" in instance && "recipient" in instance) {
    const offer = instance as Offer;
    return `<@${offer.sender.id}> <@${offer.recipient.id}>`;
  } else {
    const session = instance as Session;
    if (session.type === "CPU") {
      return `<@${session.player2.id}>`;
    } else {
      return `<@${session.player1.id}> <@${session.player2.id}>`;
    }
  }
}

function getChoiceDisplay(player: Player): string {
  return `**${player.stats.username}'s Choice:** ${player.choice} ${
    choices[player.choice!]
  }`;
}

function getPointDisplay(player: Player): string {
  const trend = player.pointDifference?.[0];
  const emoji = trend === "+" ? " 📈" : trend === "-" ? " 📉" : "";
  return `${player.stats.points} (${player.pointDifference})${emoji}`;
}

function getResultDisplay(session: Session): string {
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
  } else {
    switch (player2.result) {
      case "Tie":
        return `${player1.stats.username} and ${player2.stats.username} Tied.`;
      default:
        return `${getWinner(session).stats.username} Wins! ✓`;
    }
  }
}

function getResultFields(session: Session) {
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
        name: "Win Streak",
        value: `${player2.stats.streak}`,
        inline: true,
      },
    ];
  } else {
    const wagerResult =
      player1.result === "Tie"
        ? `${session.wager} pts Returned to Each Player`
        : `${session.wager * 2} pts go to **${
            getWinner(session).stats.username
          }**! 💰`;
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

export function embedPendingOffer(offer: Offer) {
  const embed = new EmbedBuilder()
    .setTitle("New Match Offer!")
    .addFields(
      { name: "Opponent ⚔️", value: `<@${offer.sender.id}>` },
      { name: "Wager 💰", value: `${offer.wager}` }
    )
    .setFooter({ text: "Accept offer? ⚔️" });
  return {
    content: getPings(offer),
    embeds: [embed],
    components: [createOfferButtons(offer.id)],
  };
}

export function embedDeclinedOffer(offer: Offer) {
  const embed = new EmbedBuilder()
    .setTitle("Match Offer Declined ✗")
    .setDescription(
      `<@${offer.recipient.id}> Declined <@${offer.sender.id}>'s Match Offer for ${offer.wager} pts! 🤷`
    );
  return {
    content: getPings(offer),
    embeds: [embed],
    components: [],
  };
}

export function embedSessionInProgress(session: Session) {
  const reciever = session[session.turn as "player1" | "player2"];
  const opponent = session[session.turn === "player1" ? "player2" : "player1"];

  const embed = new EmbedBuilder()
    .setTitle(`${reciever.stats.username}'s Turn!`)
    .setDescription(`⚔️ **Opponent**: ${getPlayerTag(opponent)}`)
    .addFields({
      name: "Points",
      value: `${reciever.stats.points} pts`,
      inline: true,
    });
  if (session.type === "PVP")
    embed.addFields({ name: "Wager Pot", value: `${session.wager * 2}` });

  return {
    content: getPings(session),
    embeds: [embed],
    components: [createSessionButtons(session.id)],
  };
}

export function embedSessionResult(session: Session) {
  const { player1, player2 } = session;

  const displayResult = getResultDisplay(session);
  const displayChoices = `${getChoiceDisplay(player2)}\n${getChoiceDisplay(
    player1
  )}`;
  const fields = getResultFields(session);

  const embed = new EmbedBuilder()
    .setTitle(displayResult)
    .setDescription(displayChoices)
    .addFields(fields);

  return {
    content: getPings(session),
    embeds: [embed],
    components: [createRematchButton(session.id)],
  };
}
