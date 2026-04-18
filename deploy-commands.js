/**
 * Deploy slash commands to Discord
 * Usage: node deploy-commands.js [bot-name]
 * bot-name: 'tickets', 'main', 'moderator', 'cases', or 'all' (default)
 */
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
dotenv.config();

const botName = process.argv[2] || 'all';

// Old sync function removed due to invalid await usage

// Need to use dynamic import for async readDirRecursively
async function getCommandsJSONAsync(botPath) {
  const commandsPath = path.join(botPath, 'src', 'commands');
  const commands = [];

  async function readDirRecursively(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await readDirRecursively(fullPath);
      } else if (entry.name.endsWith('.js')) {
        const command = await import(pathToFileURL(fullPath).href);
        if (command.default?.data?.toJSON) {
          commands.push(command.default.data.toJSON());
        }
      }
    }
  }

  if (fs.existsSync(commandsPath)) {
    await readDirRecursively(commandsPath);
  }

  return commands;
}

async function deployBot(botConfig, name) {
  const { token, clientId, guildId, path: botPath } = botConfig;

  if (!token || !clientId || !guildId) {
    console.log(`[${name}] Skipping: missing required credentials`);
    return;
  }

  console.log(`[${name}] Loading commands...`);
  const commands = await getCommandsJSONAsync(botPath);
  console.log(`[${name}] Loaded ${commands.length} commands`);

  if (commands.length === 0) {
    console.log(`[${name}] No commands to deploy`);
    return;
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`[${name}] Deploying commands to guild ${guildId}...`);
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log(`[${name}] ✅ Successfully deployed ${data.length} commands`);
  } catch (error) {
    console.error(`[${name}] ❌ Failed to deploy commands:`, error.message);
  }
}

const bots = {
  tickets: {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    path: __dirname,
  },
  main: {
    token: process.env.MAIN_TOKEN,
    clientId: process.env.MAIN_CLIENT_ID,
    guildId: process.env.MAIN_GUILD_ID,
    path: path.join(__dirname, 'main'),
  },
  moderator: {
    token: process.env.MOD_TOKEN,
    clientId: process.env.MOD_CLIENT_ID,
    guildId: process.env.MOD_GUILD_ID,
    path: path.join(__dirname, 'moderator'),
  },
  cases: {
    token: process.env.CASES_TOKEN,
    clientId: process.env.CASES_CLIENT_ID,
    guildId: process.env.CASES_GUILD_ID,
    path: path.join(__dirname, 'Cases'),
  },
};

if (botName === 'all') {
  for (const [name, config] of Object.entries(bots)) {
    await deployBot(config, name);
  }
} else if (bots[botName]) {
  await deployBot(bots[botName], botName);
} else {
  console.error(`Unknown bot: ${botName}. Use: tickets, main, moderator, cases, or all`);
  process.exit(1);
}
