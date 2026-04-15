import { Events, REST, Routes } from 'discord.js';
import chalk from 'chalk';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(chalk.green(`✓ Ready! Logged in as ${client.user.tag}`));

    try {
      const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
      const commands = client.commands.map(cmd => cmd.data.toJSON());

      console.log(chalk.blue(`Registering ${commands.length} (/) commands...`));

      if (process.env.GUILD_ID) {
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
          { body: commands },
        );
        console.log(chalk.green(`✓ Registered ${commands.length} guild commands.`));
      } else {
        await rest.put(
          Routes.applicationCommands(client.user.id),
          { body: commands },
        );
        console.log(chalk.green(`✓ Registered ${commands.length} global commands.`));
      }
    } catch (error) {
      console.error(chalk.red('Error registering commands:'), error);
    }
  },
};
