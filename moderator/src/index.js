import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import chalk from 'chalk';
import { connectDatabase } from '../../shared/database/mongoose.js';
import { loadCommands } from '../../shared/handlers/commandHandler.js';
import { loadEvents } from '../../shared/handlers/eventHandler.js';
import { CooldownManager } from '../../shared/utils/helpers.js';
import path from 'path';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
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
  staffRoleId: process.env.STAFF_ROLE_ID || '',
};

// Tracking with automatic cleanup
client.messageCooldowns = new CooldownManager();
client.voiceJoinTimes = new CooldownManager();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

async function init() {
  try {
    console.log(chalk.blue('Starting Moderator Bot...'));
    await connectDatabase();

    await loadCommands(client, {
      commandsPath: path.join(process.cwd(), 'src', 'commands'),
      recursive: true,
    });
    await loadEvents(client);

    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error(chalk.red('Fatal init error:'), error);
    process.exit(1);
  }
}

init();

export default client;
