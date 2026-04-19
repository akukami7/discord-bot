import { Events } from 'discord.js';
import chalk from 'chalk';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(chalk.green(`✓ Ready! Logged in as ${client.user.tag}`));

    const guilds = client.guilds.cache.map(g => g.id);
    console.log(chalk.blue(`Bot is currently in these guilds: ${guilds.join(', ') || 'none'}`));

    // Register slash commands
    try {
      const commandsToRegister = [];
      for (const [_, cmd] of client.commands) {
        if (cmd.data) {
          commandsToRegister.push(cmd.data.toJSON());
        }
      }

      console.log(chalk.yellow(`Started refreshing ${commandsToRegister.length} application (/) commands.`));

      if (process.env.GUILD_ID) {
        await client.application.commands.set(commandsToRegister, process.env.GUILD_ID);
        console.log(chalk.green('✓ Successfully reloaded guild (/) commands.'));
      } else {
        await client.application.commands.set(commandsToRegister);
        console.log(chalk.green('✓ Successfully reloaded global (/) commands.'));
      }
    } catch (error) {
      console.error(chalk.red('Error registering commands:'), error);
    }
  },
};
