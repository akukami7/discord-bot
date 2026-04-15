import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Staff from '../../models/Staff.js';
import MessageStats from '../../models/MessageStats.js';
import Points from '../../models/Points.js';
import Recruitment from '../../models/Recruitment.js';
import { formatNumber, formatTime, createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Топ списки')
    .addSubcommand(subcommand =>
      subcommand.setName('messages').setDescription('Топ по сообщениям')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('points').setDescription('Топ по баллам')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('recruitments').setDescription('Топ по наборам')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('verifications').setDescription('Топ по верификациям')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('voice').setDescription('Топ по голосу')
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;

    switch (subcommand) {
      case 'messages': {
        const stats = await MessageStats.find({ guildId })
          .sort({ messagesCount: -1 }).limit(10);

        if (stats.length === 0) {
          return interaction.editReply({ content: 'ℹ️ Нет данных.' });
        }

        const description = stats.map((s, i) => {
          const member = interaction.guild.members.cache.get(s.userId);
          const username = member ? member.user.username : s.username || 'Unknown';
          return `**${i + 1}.** ${username} • ${formatNumber(s.messagesCount)} сообщений`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setTitle('💬 Топ по сообщениям')
          .setDescription(description)
          .setFooter({ text: createFooter() });

        return interaction.editReply({ embeds: [embed] });
      }

      case 'points': {
        const points = await Points.find({ guildId })
          .sort({ points: -1 }).limit(10);

        if (points.length === 0) {
          return interaction.editReply({ content: 'ℹ️ Нет данных.' });
        }

        const description = points.map((p, i) => {
          const member = interaction.guild.members.cache.get(p.userId);
          const username = member ? member.user.username : 'Unknown';
          return `**${i + 1}.** ${username} • ${formatNumber(p.points)} баллов`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setColor(client.config.embedAccent)
          .setTitle('⭐ Топ по баллам')
          .setDescription(description)
          .setFooter({ text: createFooter() });

        return interaction.editReply({ embeds: [embed] });
      }

      case 'recruitments': {
        const staff = await Staff.find({ guildId })
          .sort({ recruitmentsCount: -1 }).limit(10);

        const activeStaff = staff.filter(s => s.recruitmentsCount > 0);
        if (activeStaff.length === 0) {
          return interaction.editReply({ content: 'ℹ️ Нет данных.' });
        }

        const description = activeStaff.map((s, i) => {
          const member = interaction.guild.members.cache.get(s.userId);
          const username = member ? member.user.username : s.username || 'Unknown';
          return `**${i + 1}.** ${username} • ${formatNumber(s.recruitmentsCount)} наборов`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setTitle('📋 Топ по наборам')
          .setDescription(description)
          .setFooter({ text: createFooter() });

        return interaction.editReply({ embeds: [embed] });
      }

      case 'verifications': {
        const staff = await Staff.find({ guildId })
          .sort({ verificationsCount: -1 }).limit(10);

        const activeStaff = staff.filter(s => s.verificationsCount > 0);
        if (activeStaff.length === 0) {
          return interaction.editReply({ content: 'ℹ️ Нет данных.' });
        }

        const description = activeStaff.map((s, i) => {
          const member = interaction.guild.members.cache.get(s.userId);
          const username = member ? member.user.username : s.username || 'Unknown';
          return `**${i + 1}.** ${username} • ${formatNumber(s.verificationsCount)} верификаций`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setTitle('✅ Топ по верификациям')
          .setDescription(description)
          .setFooter({ text: createFooter() });

        return interaction.editReply({ embeds: [embed] });
      }

      case 'voice': {
        const staff = await Staff.find({ guildId })
          .sort({ voiceOnline: -1 }).limit(10);

        const activeStaff = staff.filter(s => s.voiceOnline > 0);
        if (activeStaff.length === 0) {
          return interaction.editReply({ content: 'ℹ️ Нет данных.' });
        }

        const description = activeStaff.map((s, i) => {
          const member = interaction.guild.members.cache.get(s.userId);
          const username = member ? member.user.username : s.username || 'Unknown';
          return `**${i + 1}.** ${username} • ${formatTime(s.voiceOnline)}`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setTitle('🎙️ Топ по голосу')
          .setDescription(description)
          .setFooter({ text: createFooter() });

        return interaction.editReply({ embeds: [embed] });
      }
    }
  },
};
