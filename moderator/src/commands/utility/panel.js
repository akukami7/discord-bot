import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Панель администраторов'),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('panel_stats')
          .setLabel('📊 Статистика')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('panel_staff')
          .setLabel('👥 Состав')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('panel_reports')
          .setLabel('📝 Жалобы')
          .setStyle(ButtonStyle.Danger)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('panel_actions')
          .setLabel('🛡️ Действия')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('panel_blacklist')
          .setLabel('🚫 Чёрный список')
          .setStyle(ButtonStyle.Secondary)
      );

    const embed = new EmbedBuilder()
      .setColor(client.config.embedAccent)
      .setTitle('🎛️ Панель администраторов')
      .setDescription('Выберите действие с помощью кнопок ниже.')
      .addFields(
        { name: '📊 Статистика', value: 'Просмотр общей статистики сервера', inline: false },
        { name: '👥 Состав', value: 'Управление составом модераторов', inline: false },
        { name: '📝 Жалобы', value: 'Просмотр и управление жалобами', inline: false },
        { name: '🛡️ Действия', value: 'Последние действия модераторов', inline: false },
        { name: '🚫 Чёрный список', value: 'Управление чёрным списком', inline: false }
      )
      .setFooter({ text: createFooter() })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], components: [row1, row2] });
  },
};
