import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';
import PersonalRole from '../../models/PersonalRole.js';

export default {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Управление личной ролью')
    .addSubcommand(sub => sub
      .setName('create')
      .setDescription('Создать личную роль')
      .addStringOption(opt => opt.setName('name').setDescription('Название').setRequired(true))
      .addStringOption(opt => opt.setName('color').setDescription('Цвет (HEX, например #ff5555)').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('info')
      .setDescription('Информация о личной роли')
    )
    .addSubcommand(sub => sub
      .setName('manage')
      .setDescription('Управление личной ролью')
      .addStringOption(opt => opt.setName('action').setDescription('Действие').setRequired(true)
        .addChoices(
          { name: '✏️ Изменить название', value: 'rename' },
          { name: '🎨 Изменить цвет', value: 'recolor' },
          { name: '🗑️ Удалить роль', value: 'delete' },
        ))
      .addStringOption(opt => opt.setName('value').setDescription('Новое значение (для rename/recolor)').setRequired(false))
    ),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    if (sub === 'create') {
      await interaction.deferReply({ ephemeral: true });
      const name = interaction.options.getString('name');
      const color = interaction.options.getString('color');

      const existing = await PersonalRole.findOne({ guildId, userId });
      if (existing) return interaction.editReply('❌ У вас уже есть личная роль! Используйте `/role manage` для управления.');

      // Validate color
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
        return interaction.editReply('❌ Неверный формат цвета! Используйте HEX (например `#ff5555`)');
      }

      try {
        const role = await interaction.guild.roles.create({
          name,
          color,
          reason: `Личная роль для ${interaction.user.tag}`,
        });

        // Assign role to user
        const member = interaction.guild.members.cache.get(userId);
        if (member) await member.roles.add(role);

        await PersonalRole.create({ guildId, userId, roleId: role.id, name, color });

        const embed = new EmbedBuilder().setColor(0x2B2D31)
          .setDescription(`✅ Личная роль **${name}** создана!\nЦвет: \`${color}\``)
          .setColor(color);

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error creating role:', error);
        await interaction.editReply('❌ Ошибка при создании роли. Проверьте права бота.');
      }
    }

    if (sub === 'info') {
      await interaction.deferReply({ ephemeral: true });
      const pr = await PersonalRole.findOne({ guildId, userId });
      if (!pr) return interaction.editReply('У вас нет личной роли. Создайте через `/role create`');

      const role = interaction.guild.roles.cache.get(pr.roleId);

      const embed = new EmbedBuilder().setColor(0x2B2D31)
        .setTitle('🎭 Личная роль')
        .addFields(
          { name: 'Название', value: pr.name, inline: true },
          { name: 'Цвет', value: pr.color, inline: true },
          { name: 'ID роли', value: pr.roleId, inline: true },
          { name: 'Создана', value: `<t:${Math.floor(pr.createdAt.getTime() / 1000)}:R>`, inline: true },
        )
        .setColor(pr.color);

      if (!role) embed.setFooter({ text: '⚠️ Роль была удалена на сервере' });

      await interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'manage') {
      await interaction.deferReply({ ephemeral: true });
      const action = interaction.options.getString('action');
      const value = interaction.options.getString('value');

      const pr = await PersonalRole.findOne({ guildId, userId });
      if (!pr) return interaction.editReply('❌ У вас нет личной роли!');

      const role = interaction.guild.roles.cache.get(pr.roleId);

      if (action === 'delete') {
        if (role) await role.delete().catch(() => {});
        await PersonalRole.findByIdAndDelete(pr._id);
        return interaction.editReply('✅ Личная роль удалена.');
      }

      if (!value) return interaction.editReply('❌ Укажите новое значение в параметре `value`!');

      if (action === 'rename') {
        if (role) await role.setName(value).catch(() => {});
        pr.name = value;
        await pr.save();
        return interaction.editReply(`✅ Роль переименована в **${value}**`);
      }

      if (action === 'recolor') {
        if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
          return interaction.editReply('❌ Неверный формат цвета! Используйте HEX (например `#ff5555`)');
        }
        if (role) await role.setColor(value).catch(() => {});
        pr.color = value;
        await pr.save();
        return interaction.editReply(`✅ Цвет роли изменён на \`${value}\``);
      }
    }
  },
};
