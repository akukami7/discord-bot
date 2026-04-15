import { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } from 'discord.js';
import ShopItem from '../../models/ShopItem.js';

export default {
  data: new SlashCommandBuilder()
    .setName('additem')
    .setDescription('Добавить товар в магазин')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addStringOption(opt => opt.setName('type').setDescription('Категория товара').setRequired(true).addChoices(
        { name: 'Личные роли', value: 'role' },
        { name: 'Общее', value: 'other' }
    ))
    .addStringOption(opt => opt.setName('name').setDescription('Название товара (текст)').setRequired(true))
    .addNumberOption(opt => opt.setName('price').setDescription('Цена').setRequired(true))
    .addStringOption(opt => opt.setName('currency').setDescription('Валюта').setRequired(true).addChoices(
        { name: 'Баланс (🦋)', value: 'coins' },
        { name: 'Спонсорские (👑)', value: 'standart' }
    ))
    .addRoleOption(opt => opt.setName('role').setDescription('Какую роль выдавать (если выбраны Личные роли)').setRequired(false))
    .addStringOption(opt => opt.setName('duration').setDescription('Длительность в днях (укажите число, например 30)').setRequired(false))
    .addUserOption(opt => opt.setName('creator').setDescription('Продавец (создатель, для личных ролей)').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const type = interaction.options.getString('type');
    const name = interaction.options.getString('name');
    const price = interaction.options.getNumber('price');
    const currency = interaction.options.getString('currency');
    const roleOpt = interaction.options.getRole('role');
    const durationInput = interaction.options.getString('duration');
    const creator = interaction.options.getUser('creator');

    let durationStr = null;
    if (durationInput) {
        durationStr = parseInt(durationInput.replace(/\D/g, ''), 10);
        if (isNaN(durationStr)) durationStr = null; // Fallback to null if no valid number found
    }
    const duration = durationStr;

    if (type === 'role' && !roleOpt) {
        return interaction.editReply('❌ Для товара категории "Личные роли" обязательно нужно указать роль в опции `role`!');
    }

    const data = {};
    if (roleOpt) {
        data.roleId = roleOpt.id;
    }

    const newItem = await ShopItem.create({
        guildId: interaction.guild.id,
        name: name,
        price: price,
        currency: currency,
        type: type,
        data: data,
        duration: duration || null,
        creatorId: creator ? creator.id : null,
    });

    const embed = new EmbedBuilder()
        .setTitle('✅ Товар добавлен!')
        .setDescription(`**Название:** ${name}\n**Тип:** ${type === 'role' ? 'Личные роли' : 'Общее'}\n**Цена:** ${price} ${currency === 'standart' ? '👑' : '🦋'}`)
        .setColor(0x00FF00);

    await interaction.editReply({ embeds: [embed] });
  }
};
