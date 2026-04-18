import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createFooter, formatNumber } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('inrole')
    .setDescription('Список пользователей роли')
    .addRoleOption(option =>
      option.setName('role').setDescription('Роль').setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const role = interaction.options.getRole('role');

    if (!role.members || role.members.size === 0) {
      return interaction.editReply({ content: `ℹ️ В роли **${role.name}** нет пользователей.` });
    }

    const members = role.members;
    const memberList = members.map((m, i) => `${i + 1}. ${m.user.username}`).join('\n');

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setColor(role.color || client.config.embedColor)
      .setTitle(`👥 Пользователи в роли: ${role.name}`)
      .setDescription(memberList.length > 4096 ? memberList.slice(0, 4093) + '...' : memberList)
      .addFields(
        { name: 'Всего пользователей', value: `**${formatNumber(members.size)}**`, inline: true },
        { name: 'Цвет роли', value: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'Отсутствует', inline: true },
        { name: 'Позиция', value: `**${role.position}**`, inline: true }
      )
      .setFooter({ text: createFooter() });

    if (role.members.first()) {
      embed.setThumbnail(role.members.first().user.displayAvatarURL());
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
