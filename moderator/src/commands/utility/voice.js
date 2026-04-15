import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../../models/Staff.js';
import { formatTime, formatNumber, createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Статистика голоса')
    .addUserOption(option =>
      option.setName('user').setDescription('Пользователь').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('user');
    const guildId = interaction.guild.id;

    if (user) {
      // Show stats for specific user
      const staff = await Staff.findOne({ guildId, userId: user.id });

      if (!staff || staff.voiceOnline === 0) {
        return interaction.editReply({ content: `ℹ️ Нет данных о голосовой активности для ${user}.` });
      }

      const hours = Math.floor(staff.voiceOnline / 3600);
      const minutes = Math.floor((staff.voiceOnline % 3600) / 60);

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(`🎙️ Голосовая активность: ${user.username}`)
        .addFields(
          { name: 'Время в голосе', value: `**${hours}ч ${minutes}м**`, inline: true },
          { name: 'В секундах', value: `**${formatNumber(staff.voiceOnline)}**`, inline: true }
        )
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: createFooter() });

      return interaction.editReply({ embeds: [embed] });
    }

    // Show top voice stats
    const staff = await Staff.find({ guildId, voiceOnline: { $gt: 0 } })
      .sort({ voiceOnline: -1 })
      .limit(10);

    if (staff.length === 0) {
      return interaction.editReply({ content: 'ℹ️ Нет данных о голосовой активности.' });
    }

    const description = staff.map((s, i) => {
      const member = interaction.guild.members.cache.get(s.userId);
      const username = member ? member.user.username : s.username || 'Unknown';
      const hours = Math.floor(s.voiceOnline / 3600);
      const minutes = Math.floor((s.voiceOnline % 3600) / 60);
      return `**${i + 1}.** ${username} • ${hours}ч ${minutes}м`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('🎙️ Топ голосовой активности')
      .setDescription(description)
      .setFooter({ text: createFooter() });

    await interaction.editReply({ embeds: [embed] });
  },
};
