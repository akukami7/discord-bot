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

  // Recursively load all .js files from subdirectories
  const categories = fs.readdirSync(commandsPath).filter(f => 
    fs.statSync(path.join(commandsPath, f)).isDirectory()
  );

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      try {
        const command = await import(pathToFileURL(filePath).href);
        if ('data' in command.default && 'execute' in command.default) {
          client.commands.set(command.default.data.name, command.default);
          console.log(chalk.cyan(`  Loaded command: /${command.default.data.name} [${category}]`));
        } else {
          console.log(chalk.yellow(`  [WARNING] ${filePath} is missing "data" or "execute".`));
        }
      } catch (error) {
        console.error(chalk.red(`  Error loading command ${file}:`), error);
      }
    }
  }
};
