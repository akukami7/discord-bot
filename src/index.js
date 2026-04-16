import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import chalk from 'chalk';
import { connectDatabase } from '../shared/database/mongoose.js';
import { loadCommands } from '../shared/handlers/commandHandler.js';
import { loadEvents } from '../shared/handlers/eventHandler.js';
import path from 'path';

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

    await loadCommands(client, {
      commandsPath: path.join(process.cwd(), 'src', 'commands'),
      recursive: false,
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
