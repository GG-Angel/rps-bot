import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import {
  UserStats,
  doesUserExist,
  getLeaderboard,
  getUser,
  initUser,
} from "./users";
import {
  Offer,
  Session,
  RPSChoice,
  authenticateOffer,
  isPlayerTurn,
  getOffer,
  getSession,
  processOffer,
  progressSession,
  startOffer,
  startSession,
  doesSessionExist,
  doesOfferExist,
  Player,
  authenticateSession,
} from "./game";
import {
  embedDeclinedOffer,
  embedPendingOffer,
  embedSessionInProgress,
  embedSessionResult,
} from "./embeds";

// displays leaderboard
export async function displayLeaderboard(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const leaderboard = getLeaderboard();
  const embed = new EmbedBuilder()
    .setTitle("Top 10 Rock Paper Scissors Players 👑")
    .setDescription(leaderboard)
    .setFooter({ text: "Climb the ranks!" });

  await interaction.reply({ embeds: [embed], components: [] });
}

// displays a user's stats
export async function displayUserStats(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const targetUserId: string = interaction.options.get("user")?.value as string;

  // ensure the user exists
  if (!doesUserExist(targetUserId)) {
    await interaction.reply({
      content: "This user does not exist!",
      ephemeral: true,
    });
    return;
  }

  const targetUser: UserStats = getUser(targetUserId);
  const embed = new EmbedBuilder()
    .setTitle(`${targetUser.username}'s Stats 📊`)
    .setDescription(`Stats for <@${targetUserId}>`)
    .setFields(
      { name: "Points 🚀", value: `${targetUser.points} pts` },
      { name: "Win Streak 🔥", value: `${targetUser.streak}` },
      { name: "Wins", value: `${targetUser.wins}`, inline: true },
      { name: "Losses", value: `${targetUser.losses}`, inline: true },
      { name: "W/L Ratio", value: `${targetUser.ratio}`, inline: true }
    );

  await interaction.reply({ embeds: [embed], components: [] });
}

// handles command calls for new games
export async function handleNewGame(
  interaction: ChatInputCommandInteraction,
  gameType: "CPU" | "PVP"
): Promise<void> {
  // start a new game against the cpu
  if (gameType === "CPU") {
    const playerId: string = interaction.user.id;
    const session: Session = startSession(gameType, playerId);
    await interaction.reply(embedSessionInProgress(session));
  }

  // send a match offer to another user
  else {
    const senderId: string = interaction.user.id;
    const recieverId: string = interaction.options.get("opponent")
      ?.value as string;
    const wager: number =
      (interaction.options.get("wager")?.value as number) ?? 0;

    // prevent user from playing against the bot
    if (recieverId === "1236885244032978965") {
      await interaction.reply({
        content: "You cannot request a match against the bot.",
        ephemeral: true,
      });
      return;
    }

    initUser(
      recieverId,
      interaction.options.get("opponent")?.user?.globalName as string
    );

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
    const sender: UserStats = getUser(senderId);
    const reciever: UserStats = getUser(recieverId);
    if (wager > sender.points || wager > reciever.points) {
      await interaction.reply({
        content: `You (${sender.points}) or your opponent (${reciever.points}) do not have enough points to make this wager (${wager}).`,
        ephemeral: true,
      });
      return;
    }

    // if all safeguards are passed, send an offer
    const offer: Offer = startOffer(senderId, recieverId, wager);
    await interaction.reply(embedPendingOffer(offer));
  }
}

// handles button interactions
export async function handleButtonInteraction(
  interaction: ButtonInteraction,
  instanceId: string,
  choice: string
): Promise<void> {
  // handle game choices
  if (["Rock", "Paper", "Scissors"].includes(choice)) {
    const userId: string = interaction.user.id;
    const sessionId: string = instanceId;

    // ensure the session still exists
    if (!doesSessionExist(sessionId)) {
      await interaction.update({
        content: "Sorry, but this session no longer exists.",
        embeds: [],
        components: [],
      });
      return;
    }

    const session: Session = getSession(sessionId);
    if (isPlayerTurn(userId, session)) {
      progressSession(session, choice as RPSChoice);
      if (session.turn === "result") {
        await interaction.update(embedSessionResult(session));
      } else {
        await interaction.update(embedSessionInProgress(session));
      }
    } else {
      await interaction.reply({
        content: "You cannot make this game decision.",
        ephemeral: true,
      });
    }
  }

  // handle offers
  else if (["Accept", "Decline"].includes(choice)) {
    const userId: string = interaction.user.id;
    const offerId: string = instanceId;

    // ensure the offer still exists
    if (!doesOfferExist(offerId)) {
      await interaction.update({
        content: "Sorry, but this offer no longer exists.",
        embeds: [],
        components: [],
      });
      return;
    }

    const offer: Offer = getOffer(offerId);
    if (authenticateOffer(userId, offer)) {
      // offer accepted, start a new game
      if (choice === "Accept") {
        const session: Session = processOffer(offer, "Accept")!;
        await interaction.update(embedSessionInProgress(session!));
      }

      // offer declined
      else {
        processOffer(offer, "Decline");
        await interaction.update(embedDeclinedOffer(offer));
      }
    } else {
      await interaction.reply({
        content: `Only <@${offer.recipient.id}> can accept/decline this offer.`,
        ephemeral: true,
      });
    }
  }

  // handle rematches
  else if (choice === "Rematch") {
    const sessionId: string = instanceId;

    // ensure the session still exists
    if (!doesSessionExist(sessionId)) {
      await interaction.update({
        content: "Sorry, but this session no longer exists.",
        embeds: [],
        components: [],
      });
      return;
    }

    const session: Session = getSession(sessionId);
    const rematchUserId: string = interaction.user.id;
    const gameType: string = session.type;

    // ensure that the user is part of the session before proceeding
    if (!authenticateSession(rematchUserId, session)) {
      await interaction.reply({
        content: "Sorry, but you are not part of this session.",
        ephemeral: true,
      });
      return;
    }

    // rematch cpu
    if (gameType === "CPU") {
      const playerId: string = session.player2.id;
      const newSession: Session = startSession(gameType, playerId);
      await interaction.update(embedSessionInProgress(newSession));
    }

    // rematch pvp
    else {
      const { player1, player2 } = session;
      const sender: Player = rematchUserId === player1.id ? player1 : player2;
      const reciever: Player = rematchUserId === player1.id ? player2 : player1;

      // prevent users from wagering more than they have after the previous match
      if (
        session.wager > sender.stats.points ||
        session.wager > reciever.stats.points
      ) {
        await interaction.reply({
          content: `You (${sender.stats.points}) or your opponent (${reciever.stats.points}) do not have enough points to make this wager (${session.wager}).`,
          ephemeral: true,
        });
        return;
      } else {
        const offer: Offer = startOffer(sender.id, reciever.id, session.wager);
        await interaction.update(embedPendingOffer(offer));
      }
    }
  }
}
