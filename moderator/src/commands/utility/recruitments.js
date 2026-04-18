import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Recruitment from '../../models/Recruitment.js';
import { formatTime, createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('recruitments')
    .setDescription('Наборы и статистика')
    .addSubcommand(subcommand =>
      subcommand
        .setName('reaction')
        .setDescription('Посмотреть среднее время реакции на наборы')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Статистика наборов')
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;

    if (subcommand === 'reaction') {
      const recruitments = await Recruitment.find({
        guildId,
        firstResponseAt: { $exists: true, $ne: null },
        responseTime: { $gt: 0 },
      }).limit(100);

      if (recruitments.length === 0) {
        return interaction.editReply({ content: 'ℹ️ Нет данных о времени реакции на наборы.' });
      }

      // Calculate average response time
      const totalResponseTime = recruitments.reduce((sum, r) => sum + r.responseTime, 0);
      const avgResponseTime = totalResponseTime / recruitments.length;

      // Calculate fastest and slowest
      const sorted = [...recruitments].sort((a, b) => a.responseTime - b.responseTime);
      const fastest = sorted[0];
      const slowest = sorted[sorted.length - 1];

      const embed = new EmbedBuilder().setColor(0x2B2D31)
        .setColor(client.config.embedColor)
        .setTitle('⏱️ Среднее время реакции на наборы')
        .addFields(
          { name: 'Среднее время', value: `**${formatTime(Math.floor(avgResponseTime / 1000))}**`, inline: true },
          { name: 'Всего наборов', value: `**${recruitments.length}**`, inline: true },
          { name: 'Период', value: 'Последние 100 записей', inline: true },
          { name: 'Самое быстрое', value: `${formatTime(Math.floor(fastest.responseTime / 1000))} • ${fastest.responderName || 'Unknown'}`, inline: false },
          { name: 'Самое медленное', value: `${formatTime(Math.floor(slowest.responseTime / 1000))} • ${slowest.responderName || 'Unknown'}`, inline: false }
        )
        .setFooter({ text: createFooter() });

      await interaction.editReply({ embeds: [embed] });
    } else if (subcommand === 'stats') {
      const [total, pending, accepted, rejected] = await Promise.all([
        Recruitment.countDocuments({ guildId }),
        Recruitment.countDocuments({ guildId, status: 'pending' }),
        Recruitment.countDocuments({ guildId, status: 'accepted' }),
        Recruitment.countDocuments({ guildId, status: 'rejected' }),
      ]);

      const embed = new EmbedBuilder().setColor(0x2B2D31)
        .setColor(client.config.embedColor)
        .setTitle('📊 Статистика наборов')
        .addFields(
          { name: 'Всего', value: `**${total}**`, inline: true },
          { name: 'В ожидании', value: `**${pending}**`, inline: true },
          { name: 'Принято', value: `**${accepted}**`, inline: true },
          { name: 'Отклонено', value: `**${rejected}**`, inline: true }
        )
        .setFooter({ text: createFooter() });

      if (total > 0) {
        const acceptanceRate = ((accepted / total) * 100).toFixed(1);
        embed.addFields({ name: 'Процент принятия', value: `**${acceptanceRate}%**`, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
