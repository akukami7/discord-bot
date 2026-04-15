import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';
import Transaction from '../../models/Transaction.js';
import { formatNumber } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('convert')
    .setDescription('Конвертировать звёзды в монеты')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Количество звёзд').setRequired(true).setMinValue(1)),
  async execute(interaction, client) {
    const starAmount = interaction.options.getInteger('amount');
    const coinAmount = starAmount * client.config.starToCoinRate;

    await interaction.deferReply();

    const user = await User.findOne({ guildId: interaction.guild.id, userId: interaction.user.id });
    if (!user || user.stars < starAmount) {
      return interaction.editReply('❌ Недостаточно звёзд!');
    }

    await User.findOneAndUpdate(
      { guildId: interaction.guild.id, userId: interaction.user.id },
      { $inc: { stars: -starAmount, balance: coinAmount } }
    );

    await Transaction.create({
      guildId: interaction.guild.id,
      fromId: interaction.user.id,
      amount: coinAmount,
      type: 'convert',
      description: `Конвертация ${starAmount} ⭐ → ${coinAmount} 💰`,
    });

    const embed = new EmbedBuilder()
      .setDescription(`✅ Конвертировано **${formatNumber(starAmount)}** ⭐ → **${formatNumber(coinAmount)}** 💰\n(Курс: 1⭐ = ${client.config.starToCoinRate}💰)`)
      .setColor(0x57F287);

    await interaction.editReply({ embeds: [embed] });
  },
};
