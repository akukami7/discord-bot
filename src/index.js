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
    GatewayIntentBits.DirectMessages,
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
};

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

async function init() {
  try {
    console.log(chalk.blue('Starting Tickets Bot...'));
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
