import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Показать список всех доступных команд'),
  async execute(interaction, client) {
    await interaction.deferReply();

    const commands = client.commands.map(cmd => ({
      name: cmd.data.name,
      description: cmd.data.description,
    })).sort((a, b) => a.name.localeCompare(b.name));

    const commandList = commands.map(cmd =>
      `**\`/${cmd.name}\`** — ${cmd.description}`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('📋 Список команд')
      .setDescription(commandList || 'Нет доступных команд.')
      .setColor(client.config.embedColor)
      .setFooter({ text: `Всего команд: ${commands.length}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
