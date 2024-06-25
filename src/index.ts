import "dotenv/config";
import { Client, IntentsBitField } from "discord.js";
import { loadUserStats, initUser } from "./users";
import {
  displayLeaderboard,
  displayUserStats,
  handleButtonInteraction,
  handleNewGame,
} from "./interactions";

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

// load users on startup
loadUserStats();

// log when bot is online
client.on("ready", (c) => {
  console.log(`✅ ${c.user.username} is online!`);
});

// listen for slash commands
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    initUser(interaction.user.id, interaction.user.displayName);
    console.log(
      `💭 ${interaction.user.displayName} Used /${interaction.commandName}`
    );

    switch (interaction.commandName) {
      case "leaderboard":
        displayLeaderboard(interaction);
        break;
      case "stats":
        displayUserStats(interaction);
        break;
      case "rps-cpu":
        handleNewGame(interaction, "CPU");
        break;
      case "rps-pvp":
        handleNewGame(interaction, "PVP");
        break;
      default:
        interaction.reply({
          content: "This is an invalid command.",
          ephemeral: true,
        });
    }
  } catch (error) {
    console.error("Error handling slash command:", error);
  }
});

// listen for button presses
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isButton()) return;
    initUser(interaction.user.id, interaction.user.displayName);
    console.log(
      `💭 ${interaction.user.displayName} Pressed a Button: ${interaction.customId}`
    );

    // parse button id (format: id_choice)
    const buttonIdParts = interaction.customId.split("_");
    const instanceId: string = buttonIdParts[0];
    const choice = buttonIdParts[1];

    handleButtonInteraction(interaction, instanceId, choice);
  } catch (error) {
    console.error("Error handling button interaction:", error);
  }
});

// bot startup
client.login(process.env.TOKEN);
