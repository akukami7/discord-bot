import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import Report from '../../models/Report.js';
import { formatDate, createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Пожаловаться на пользователя')
    .addUserOption(option =>
      option.setName('user').setDescription('Пользователь').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Причина жалобы').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description').setDescription('Подробное описание').setRequired(false)
    )
    .addStringOption(option =>
      option.setName('evidence').setDescription('Ссылка на доказательство').setRequired(false)
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const description = interaction.options.getString('description') || '';
    const evidence = interaction.options.getString('evidence') || '';

    // Cannot report yourself
    if (user.id === interaction.user.id) {
      return interaction.editReply({ content: '❌ Вы не можете пожаловаться на себя.' });
    }

    // Create report
    const report = await Report.create({
      guildId: interaction.guild.id,
      reporterId: interaction.user.id,
      reporterName: interaction.user.username,
      reportedId: user.id,
      reportedName: user.username,
      reason,
      description,
      evidenceUrls: evidence ? [evidence] : [],
      channelId: interaction.channel.id,
    });

    const embed = new EmbedBuilder()
      .setColor(client.config.embedAccent)
      .setTitle('📝 Жалоба отправлена')
      .setDescription('Ваша жалоба успешно отправлена и будет рассмотрена модераторами.')
      .addFields(
        { name: 'Пользователь', value: user.username, inline: true },
        { name: 'Причина', value: reason, inline: false },
        { name: 'ID жалобы', value: report._id.toString().slice(-8), inline: true }
      )
      .setFooter({ text: createFooter() });

    await interaction.editReply({ embeds: [embed] });

    // Send to report channel if configured
    const reportChannelId = process.env.REPORT_CHANNEL_ID;
    if (reportChannelId) {
      const channel = await client.channels.fetch(reportChannelId).catch(() => null);
      if (channel && (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement)) {
        const reportEmbed = new EmbedBuilder()
          .setColor(0xFF6B6B)
          .setTitle('🚨 Новая жалоба')
          .addFields(
            { name: 'От кого', value: `${interaction.user.username} (${interaction.user.id})`, inline: true },
            { name: 'На кого', value: `${user.username} (${user.id})`, inline: true },
            { name: 'Причина', value: reason, inline: false },
            { name: 'Описание', value: description || 'Нет', inline: false },
            { name: 'Канал', value: `<#${interaction.channel.id}>`, inline: true },
            { name: 'ID', value: report._id.toString().slice(-8), inline: true }
          )
          .setFooter({ text: createFooter() })
          .setTimestamp();

        if (evidence) {
          reportEmbed.addFields({ name: 'Доказательство', value: evidence, inline: false });
        }

        try {
          await channel.send({ embeds: [reportEmbed] });
        } catch (e) {
          console.error('Failed to send report to channel:', e);
        }
      }
    }
  },
};
