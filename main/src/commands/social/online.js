import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';
import { formatTime } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('online')
    .setDescription('Проверить голосовой онлайн')
    .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(false)),
  async execute(interaction, client) {
    const target = interaction.options.getUser('user') || interaction.user;

    await interaction.deferReply();

    const user = await User.findOne({ guildId: interaction.guild.id, userId: target.id });
    const totalSeconds = user?.voiceOnline || 0;

    // Calculate daily — reset if it's a new day
    const today = new Date().toDateString();
    const lastReset = user?.lastDailyReset ? user.lastDailyReset.toDateString() : null;
    const dailySeconds = (lastReset === today) ? (user?.dailyVoiceOnline || 0) : 0;

    // If currently in voice, add current session
    let currentSession = 0;
    if (user?.voiceJoinedAt) {
      currentSession = Math.floor((Date.now() - user.voiceJoinedAt.getTime()) / 1000);
    }

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle(`Голосовой онлайн — ${target.displayName}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'За сутки', value: formatTime(dailySeconds + currentSession), inline: true },
        { name: 'За все время', value: formatTime(totalSeconds + currentSession), inline: true },
      )
      .setColor(client.config.embedColor);

    await interaction.editReply({ embeds: [embed] });
  },
};
