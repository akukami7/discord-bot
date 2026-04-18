import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';
import Transaction from '../../models/Transaction.js';
import { formatNumber, CooldownManager } from '../../../../shared/utils/helpers.js';

const giveCooldown = new CooldownManager();
const COOLDOWN_MS = 5000; // 5 seconds

export default {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Передать монеты другому пользователю')
    .addUserOption(opt => opt.setName('user').setDescription('Кому').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Сумма').setRequired(true).setMinValue(1).setMaxValue(1000000)),
  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'Нельзя передать монеты самому себе!', ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: 'Нельзя передать монеты боту!', ephemeral: true });
    }

    // Rate limiting
    const cooldownKey = `give_${interaction.user.id}`;
    if (giveCooldown.isOnCooldown(cooldownKey, COOLDOWN_MS)) {
      const remaining = giveCooldown.getRemainingTime(cooldownKey, COOLDOWN_MS);
      return interaction.reply({ content: `⏳ Подождите ${Math.ceil(remaining / 1000)}с. перед следующим переводом.`, ephemeral: true });
    }

    await interaction.deferReply();

    const guildId = interaction.guild.id;

    // Atomic transfer with balance check in query to prevent race condition
    const senderResult = await User.findOneAndUpdate(
      { guildId, userId: interaction.user.id, balance: { $gte: amount } },
      { $inc: { balance: -amount } }
    );

    if (!senderResult) {
      return interaction.editReply('❌ Недостаточно монет!');
    }

    await User.findOneAndUpdate(
      { guildId, userId: target.id },
      { $inc: { balance: amount } },
      { upsert: true }
    );

    // Log transaction
    await Transaction.create({
      guildId,
      fromId: interaction.user.id,
      toId: target.id,
      amount,
      type: 'give',
      description: `Перевод ${interaction.user.displayName} → ${target.displayName}`,
    });

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setDescription(`✅ ${interaction.user} передал **${formatNumber(amount)}** 💰 пользователю ${target}`)
      .setColor(0x57F287);

    await interaction.editReply({ embeds: [embed] });
  },
};
