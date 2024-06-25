"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const users_1 = require("./users");
const interactions_1 = require("./interactions");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.IntentsBitField.Flags.Guilds,
        discord_js_1.IntentsBitField.Flags.GuildMembers,
        discord_js_1.IntentsBitField.Flags.GuildMessages,
        discord_js_1.IntentsBitField.Flags.MessageContent,
    ],
});
// load users on startup
(0, users_1.loadUserStats)();
// log when bot is online
client.on("ready", (c) => {
    console.log(`✅ ${c.user.username} is online!`);
});
// listen for slash commands
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    (0, users_1.initUser)(interaction.user.id, interaction.user.displayName);
    console.log(`💭 ${interaction.user.displayName} Used /${interaction.commandName}`);
    switch (interaction.commandName) {
        case "leaderboard":
            (0, interactions_1.displayLeaderboard)(interaction);
            break;
        case "stats":
            (0, interactions_1.displayUserStats)(interaction);
            break;
        case "rps-cpu":
            (0, interactions_1.handleNewGame)(interaction, "CPU");
            break;
        case "rps-pvp":
            (0, interactions_1.handleNewGame)(interaction, "PVP");
            break;
        default:
            interaction.reply({
                content: "This is an invalid command.",
                ephemeral: true,
            });
    }
});
// listen for button presses
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton())
        return;
    (0, users_1.initUser)(interaction.user.id, interaction.user.displayName);
    console.log(`💭 ${interaction.user.displayName} Pressed a Button: ${interaction.customId}`);
    // parse button id (format: id_choice)
    const buttonIdParts = interaction.customId.split("_");
    const instanceId = buttonIdParts[0];
    const choice = buttonIdParts[1];
    (0, interactions_1.handleButtonInteraction)(interaction, instanceId, choice);
});
// bot startup
client.login(process.env.TOKEN);
