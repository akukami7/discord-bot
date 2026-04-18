import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import chalk from 'chalk';

export const loadCommands = async (client) => {
  const commandsPath = path.join(process.cwd(), 'src', 'commands');

  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = await import(pathToFileURL(filePath).href);
      if ('data' in command.default && 'execute' in command.default) {
        client.commands.set(command.default.data.name, command.default);
        console.log(chalk.cyan(`Loaded command: ${command.default.data.name}`));
      } else {
        console.log(chalk.yellow(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`));
      }
    } catch (error) {
      console.error(chalk.red(`Error loading command ${file}:`), error);
    }
  }
};
