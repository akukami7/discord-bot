import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import chalk from 'chalk';
import { connectDatabase } from './database/mongoose.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.User,
    Partials.Message,
  ],
});

client.commands = new Collection();
client.config = {
  embedColor: Number(process.env.EMBED_COLOR) || 0x2f3136,
  embedAccent: Number(process.env.EMBED_ACCENT) || 0x5865F2,
  timelyAmount: parseInt(process.env.TIMELY_AMOUNT) || 200,
  timelyCooldown: parseInt(process.env.TIMELY_COOLDOWN) || 43200000,
  starToCoinRate: parseInt(process.env.STAR_TO_COIN_RATE) || 100,
  xpCooldown: parseInt(process.env.XP_COOLDOWN) || 60000,
  xpMin: parseInt(process.env.XP_MIN) || 15,
  xpMax: parseInt(process.env.XP_MAX) || 25,
};

// XP cooldown tracker (in-memory)
client.xpCooldowns = new Map();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

async function init() {
  try {
    console.log(chalk.blue('Starting Main Bot...'));
    await connectDatabase();

    await loadCommands(client);
    await loadEvents(client);

    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error(chalk.red('Fatal init error:'), error);
    process.exit(1);
  }
}

init();

export default client;
