import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import ViolationHistory from '../../models/ViolationHistory.js';
import ModeratorAction from '../../models/ModeratorAction.js';
import { formatDate, createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Посмотреть историю нарушений')
    .addUserOption(option =>
      option.setName('user').setDescription('Пользователь').setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('user');
    const guildId = interaction.guild.id;

    // Get violations from both tables
    const [violations, actions] = await Promise.all([
      ViolationHistory.find({ guildId, userId: user.id }).sort({ createdAt: -1 }).limit(15),
      ModeratorAction.find({ guildId, targetId: user.id }).sort({ createdAt: -1 }).limit(15),
    ]);

    if (violations.length === 0 && actions.length === 0) {
      return interaction.editReply({ content: `ℹ️ У пользователя ${user} нет нарушений.` });
    }

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setColor(client.config.embedColor)
      .setTitle(`📜 История нарушений: ${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: createFooter() });

    let description = '';

    if (violations.length > 0) {
      description += '**🚨 Нарушения:**\n';
      description += violations.map((v, i) =>
        `**${i + 1}.** ${v.type} • ${v.reason || 'Без причины'} • ${v.moderatorName} • ${formatDate(v.createdAt)}${v.isActive ? '' : ' (снято)'}`
      ).join('\n');
    }

    if (actions.length > 0) {
      if (violations.length > 0) description += '\n\n';
      description += '**📋 Действия модераторов:**\n';
      description += actions.map((a, i) =>
        `**${i + 1}.** ${a.type} • ${a.reason || 'Без причины'} • ${a.moderatorName} • ${formatDate(a.createdAt)}`
      ).join('\n');
    }

    embed.setDescription(description);

    // Calculate stats
    const totalViolations = violations.filter(v => v.isActive).length;
    const totalActions = actions.length;

    embed.addFields(
      { name: 'Активные нарушения', value: `${totalViolations}`, inline: true },
      { name: 'Действия модераторов', value: `${totalActions}`, inline: true },
      { name: 'Всего', value: `${totalViolations + totalActions}`, inline: true }
    );

    await interaction.editReply({ embeds: [embed] });
  },
};
