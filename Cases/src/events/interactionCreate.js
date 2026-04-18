import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing /${interaction.commandName}:`, error);
        const payload = { content: '❌ Произошла ошибка при выполнении команды.', flags: 64 };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('buy_case_')) {
        const caseCmd = client.commands.get('case');
        if (caseCmd && caseCmd.handleButton) {
          try {
            await caseCmd.handleButton(interaction, client);
          } catch (e) {
            console.error('Case button error:', e);
          }
        }
      }
    }
  },
};
