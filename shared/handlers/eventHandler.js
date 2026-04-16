import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import chalk from 'chalk';

export const loadEvents = async (client) => {
  const eventsPath = path.join(process.cwd(), 'src', 'events');

  if (!fs.existsSync(eventsPath)) {
    fs.mkdirSync(eventsPath, { recursive: true });
    return;
  }

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
      const event = await import(pathToFileURL(filePath).href);
      if (event.default.once) {
        client.once(event.default.name, (...args) => event.default.execute(...args, client));
      } else {
        client.on(event.default.name, (...args) => event.default.execute(...args, client));
      }
      console.log(chalk.cyan(`Loaded event: ${event.default.name}`));
    } catch (error) {
      console.error(chalk.red(`Error loading event ${file}:`), error);
    }
  }
};
