import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import User from '../../models/User.js';
import Transaction from '../../models/Transaction.js';
import { formatNumber } from '../../utils/helpers.js';

const COINFLIP_GIF = 'https://media1.tenor.com/m/jCBvGeRFhN8AAAAd/coin-flip.gif';
const COINFLIP_WIN_GIF = 'https://media1.tenor.com/m/0gj5Kz6HQUIAAAAd/money-rain-make-it-rain.gif';
const COINFLIP_LOSE_GIF = 'https://media1.tenor.com/m/PuGMVjSfRIkAAAAd/money-gone.gif';

// Track processed coinflips to prevent double-clicks
const processedCoinflips = new Set();

export default {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Сыграть в монетку')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Ставка').setRequired(true).setMinValue(10)),
  async execute(interaction, client) {
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    await interaction.deferReply();

    const user = await User.findOne({ guildId, userId });
    if (!user || user.balance < amount) {
      return interaction.editReply('❌ Недостаточно монет!');
    }

    const embed = new EmbedBuilder()
      .setTitle(`Монетка — ${interaction.user.displayName}`)
      .setDescription(`<@${userId}>, выберите сторону на которую хотите поставить ваши\n**${formatNumber(amount)}** 🦋`)
      .setColor(0x2B2D31);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`coinflip_heads_${userId}_${amount}`)
        .setLabel('Орел')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`coinflip_tails_${userId}_${amount}`)
        .setLabel('Решка')
        .setStyle(ButtonStyle.Secondary),
    );

    const msg = await interaction.editReply({ embeds: [embed], components: [row] });

    // Auto-expire after 30 seconds
    setTimeout(async () => {
      if (!processedCoinflips.has(msg.id)) {
        processedCoinflips.add(msg.id);
        const expEmbed = new EmbedBuilder()
          .setTitle(`Монетка — ${interaction.user.displayName}`)
          .setDescription(`<@${userId}>, время на ответ **вышло**`)
          .setColor(0x2B2D31);
        await interaction.editReply({ embeds: [expEmbed], components: [] }).catch(() => {});
      }
    }, 30000);
  },

  async handleButton(interaction, client) {
    const parts = interaction.customId.split('_');
    const side = parts[1]; // heads or tails
    const ownerId = parts[2];
    const amount = parseInt(parts[3]);

    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: 'Это не ваша игра!', flags: 64 });
    }

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    // Prevent double-click using message ID
    const msgId = interaction.message.id;
    if (processedCoinflips.has(msgId)) {
      return interaction.reply({ content: 'Эта игра уже завершена.', flags: 64 });
    }
    processedCoinflips.add(msgId);

    await interaction.deferUpdate();

    // Re-check balance
    const user = await User.findOne({ guildId, userId });
    if (!user || user.balance < amount) {
      const errEmbed = new EmbedBuilder()
        .setTitle(`Монетка — ${interaction.user.displayName}`)
        .setDescription(`<@${userId}>, недостаточно монет!`)
        .setColor(0xED4245);
      return interaction.editReply({ embeds: [errEmbed], components: [] });
    }

    const sideText = side === 'heads' ? 'Орёл' : 'Решка';

    // Step 1: Show spinning animation
    const spinEmbed = new EmbedBuilder()
      .setTitle(`Монетка — ${interaction.user.displayName}`)
      .setDescription(`Ставка: **${formatNumber(amount)}** 🦋\nВыбранная сторона: **${sideText}**\n\n🪙 Монетка крутится...`)
      .setThumbnail(COINFLIP_GIF)
      .setColor(0xFEE75C);

    await interaction.editReply({ embeds: [spinEmbed], components: [] });

    // Step 2: Wait for animation
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Step 3: Calculate result and show
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === side;
    const resultText = result === 'heads' ? 'Орёл' : 'Решка';

    if (won) {
      await User.findOneAndUpdate({ guildId, userId }, { $inc: { balance: amount } });
      await Transaction.create({
        guildId,
        fromId: userId,
        amount: amount,
        type: 'coinflip',
        description: `Выигрыш в монетку: +${amount}`,
      });
    } else {
      await User.findOneAndUpdate({ guildId, userId }, { $inc: { balance: -amount } });
      await Transaction.create({
        guildId,
        fromId: userId,
        amount: -amount,
        type: 'coinflip',
        description: `Проигрыш в монетку: -${amount}`,
      });
    }

    const resultEmbed = new EmbedBuilder()
      .setTitle(`Монетка — ${interaction.user.displayName}`)
      .setDescription(
        `Ставка: **${formatNumber(amount)}** 🦋\n` +
        `Выбранная сторона: **${sideText}**\n` +
        `Результат: **${resultText}**\n\n` +
        (won
          ? `🎉 Вы выиграли **${formatNumber(amount)}** 🦋!`
          : `😢 Вы проиграли **${formatNumber(amount)}** 🦋`)
      )
      .setThumbnail(won ? COINFLIP_WIN_GIF : COINFLIP_LOSE_GIF)
      .setColor(won ? 0x57F287 : 0xED4245);

    await interaction.editReply({ embeds: [resultEmbed], components: [] });
  },
};
