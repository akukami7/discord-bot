import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sponsor')
    .setDescription('Управление спонсором')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addSubcommand(sub => sub
      .setName('manage')
      .setDescription('Управление спонсорами')
      .addStringOption(opt => opt.setName('action').setDescription('Действие').setRequired(true)
        .addChoices(
          { name: '➕ Добавить спонсора', value: 'add' },
          { name: '➖ Убрать спонсора', value: 'remove' },
          { name: '📋 Список спонсоров', value: 'list' },
        ))
      .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(false))
      .addRoleOption(opt => opt.setName('role').setDescription('Роль спонсора').setRequired(false))
    ),
  async execute(interaction, client) {
    const action = interaction.options.getString('action');
    const targetUser = interaction.options.getUser('user');
    const sponsorRole = interaction.options.getRole('role');

    await interaction.deferReply({ ephemeral: true });

    if (action === 'list') {
      // Find all members with a role that has "спонсор" in name
      const sponsorRoles = interaction.guild.roles.cache.filter(r => r.name.toLowerCase().includes('спонсор'));

      if (sponsorRoles.size === 0) {
        return interaction.editReply('Роли спонсоров не найдены.');
      }

      const lines = [];
      for (const [, role] of sponsorRoles) {
        const members = role.members.map(m => m.toString()).join(', ') || 'Нет участников';
        lines.push(`**${role.name}** — ${members}`);
      }

      const embed = new EmbedBuilder().setColor(0x2B2D31)
        .setTitle('⭐ Спонсоры')
        .setDescription(lines.join('\n\n'))
        .setColor(client.config.embedAccent);

      return interaction.editReply({ embeds: [embed] });
    }

    if (!targetUser) return interaction.editReply('❌ Укажите пользователя!');
    if (!sponsorRole) return interaction.editReply('❌ Укажите роль спонсора!');

    const member = interaction.guild.members.cache.get(targetUser.id);
    if (!member) return interaction.editReply('❌ Пользователь не на сервере.');

    if (action === 'add') {
      await member.roles.add(sponsorRole).catch(() => {});
      return interaction.editReply(`✅ ${targetUser} получил роль **${sponsorRole.name}**`);
    }

    if (action === 'remove') {
      await member.roles.remove(sponsorRole).catch(() => {});
      return interaction.editReply(`✅ У ${targetUser} убрана роль **${sponsorRole.name}**`);
    }
  },
};
