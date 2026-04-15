import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import MessageStats from '../../models/MessageStats.js';
import { formatNumber, createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('messages')
    .setDescription('Посмотреть текстовую активность состава')
    .addUserOption(option =>
      option.setName('user').setDescription('Конкретный пользователь').setRequired(false)
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('user');
    const guildId = interaction.guild.id;

    if (user) {
      // Show stats for specific user
      const stats = await MessageStats.findOne({ guildId, userId: user.id });

      if (!stats || stats.messagesCount === 0) {
        return interaction.editReply({ content: `ℹ️ Нет данных о сообщениях для ${user}.` });
      }

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(`📊 Активность: ${user.username}`)
        .addFields(
          { name: 'Всего сообщений', value: `**${formatNumber(stats.messagesCount)}**`, inline: true },
          { name: 'Последнее сообщение', value: stats.lastMessageAt ? `<t:${Math.floor(stats.lastMessageAt.getTime() / 1000)}:R>` : 'Н/Д', inline: true }
        )
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: createFooter() });

      return interaction.editReply({ embeds: [embed] });
    }

    // Show top message stats
    const stats = await MessageStats.find({ guildId })
      .sort({ messagesCount: -1 })
      .limit(10);

    if (stats.length === 0) {
      return interaction.editReply({ content: 'ℹ️ Нет данных о сообщениях.' });
    }

    const description = stats.map((s, i) => {
      const member = interaction.guild.members.cache.get(s.userId);
      const username = member ? member.user.username : s.username || 'Unknown';
      return `**${i + 1}.** ${username} • ${formatNumber(s.messagesCount)} сообщений`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('📊 Топ текстовой активности')
      .setDescription(description)
      .setFooter({ text: createFooter() });

    await interaction.editReply({ embeds: [embed] });
  },
};
