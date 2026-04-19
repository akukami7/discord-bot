import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nicknames')
    .setDescription('Посмотреть историю никнеймов')
    .addUserOption(option =>
      option.setName('user').setDescription('Пользователь').setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('user');
    const NicknameHistory = (await import('../../models/NicknameHistory.js')).default;

    const histories = await NicknameHistory.find({
      guildId: interaction.guild.id,
      userId: user.id,
    }).sort({ changedAt: -1 }).limit(10);

    if (histories.length === 0) {
      return interaction.editReply({ content: `ℹ️ Нет истории никнеймов для ${user}.` });
    }

    const description = histories.map((h, i) => {
      const oldNick = h.oldNickname || 'Без ника';
      const newNick = h.newNickname || user.username;
      return `**${i + 1}.** \`${oldNick}\` → \`${newNick}\` • ${h.changedBy === 'self' ? 'сам' : h.moderatorName} • ${new Date(h.changedAt).toLocaleString('ru-RU')}`;
    }).join('\n');

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setColor(client.config.embedColor)
      .setTitle(`🏷️ История никнеймов: ${user.username}`)
      .setDescription(description)
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: createFooter() });

    await interaction.editReply({ embeds: [embed] });
  },
};
