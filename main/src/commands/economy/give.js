import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';
import Transaction from '../../models/Transaction.js';
import { formatNumber } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Передать монеты другому пользователю')
    .addUserOption(opt => opt.setName('user').setDescription('Кому').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Сумма').setRequired(true).setMinValue(1)),
  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'Нельзя передать монеты самому себе!', ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: 'Нельзя передать монеты боту!', ephemeral: true });
    }

    await interaction.deferReply();

    const sender = await User.findOne({ guildId: interaction.guild.id, userId: interaction.user.id });
    if (!sender || sender.balance < amount) {
      return interaction.editReply('❌ Недостаточно монет!');
    }

    // Atomic transfer
    await User.findOneAndUpdate(
      { guildId: interaction.guild.id, userId: interaction.user.id },
      { $inc: { balance: -amount } }
    );
    await User.findOneAndUpdate(
      { guildId: interaction.guild.id, userId: target.id },
      { $inc: { balance: amount } },
      { upsert: true }
    );

    // Log transaction
    await Transaction.create({
      guildId: interaction.guild.id,
      fromId: interaction.user.id,
      toId: target.id,
      amount,
      type: 'give',
      description: `Перевод ${interaction.user.displayName} → ${target.displayName}`,
    });

    const embed = new EmbedBuilder()
      .setDescription(`✅ ${interaction.user} передал **${formatNumber(amount)}** 💰 пользователю ${target}`)
      .setColor(0x57F287);

    await interaction.editReply({ embeds: [embed] });
  },
};
