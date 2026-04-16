import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import chalk from 'chalk';

/**
 * Load commands from a directory.
 * @param {import('discord.js').Client} client - Discord client
 * @param {Object} options - Options
 * @param {string} options.commandsPath - Path to commands directory
 * @param {boolean} options.recursive - Whether to load from subdirectories
 * @param {string} [options.category] - Category name for logging
 */
export const loadCommands = async (client, { commandsPath, recursive = false, category = '' } = {}) => {
  if (!commandsPath) {
    commandsPath = path.join(process.cwd(), 'src', 'commands');
  }

  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    return;
  }

  const commandFiles = [];

  if (recursive) {
    const categories = fs.readdirSync(commandsPath).filter(f =>
      fs.statSync(path.join(commandsPath, f)).isDirectory()
    );

    for (const cat of categories) {
      const categoryPath = path.join(commandsPath, cat);
      const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
      for (const file of files) {
        commandFiles.push({ filePath: path.join(categoryPath, file), category: cat });
      }
    }
  } else {
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of files) {
      commandFiles.push({ filePath: path.join(commandsPath, file), category });
    }
  }

  for (const { filePath, category: cat } of commandFiles) {
    try {
      const command = await import(pathToFileURL(filePath).href);
      if ('data' in command.default && 'execute' in command.default) {
        client.commands.set(command.default.data.name, command.default);
        const label = cat ? `/${command.default.data.name} [${cat}]` : command.default.data.name;
        console.log(chalk.cyan(`  Loaded command: ${label}`));
      } else {
        console.log(chalk.yellow(`  [WARNING] ${filePath} is missing "data" or "execute".`));
      }
    } catch (error) {
      console.error(chalk.red(`  Error loading command ${path.basename(filePath)}:`), error);
    }
  }
};
