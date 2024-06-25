import 'dotenv/config';
import { REST, Routes, ApplicationCommandOptionType } from 'discord.js';

// all slash commands
const commands = [
  {
    name: 'stats',
    description: 'Display a user\'s stats.',
    options: [
      {
        name: 'user',
        description: 'The user whose stats you would like to see.',
        type: ApplicationCommandOptionType.User,
        required: true
      }
    ]
  },
  {
    name: 'leaderboard',
    description: 'Display a leaderboard of all users sorted by points.'
  },
  {
    name: 'rps-cpu',
    description: 'Play a game of Rock Paper Scissors against the CPU.'
  },
  {
    name: 'rps-pvp',
    description: 'Start a game of Rock, Paper, Scissors against another user with an optional wager.',
    options: [
      {
        name: 'opponent',
        description: 'The user you would like to play against.',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'wager',
        description: 'The amount of points you would like to wager in this game.',
        type: ApplicationCommandOptionType.Number,
      }
    ]
  }
]

// ensure tokens are defined
if (!process.env.TOKEN || !process.env.CLIENT_ID) {
  console.error('Error: Tokens are not properly defined.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// register slash commands
(async () => {
  try {
    console.log('Registering slash commands...')
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('Slash commands registered successfully!')
  } catch (error) {
    console.log(`There was an error: ${error}`)
  }
})();