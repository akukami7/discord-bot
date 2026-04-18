import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import CaseUser from '../../models/CaseUser.js';
import MainUser from '../../models/User.js';
import { formatNumber, formatDate, CooldownManager } from '../../../../shared/utils/helpers.js';

const CASE_PRICE = 500;

// Cooldown to prevent spam
const caseCooldown = new CooldownManager();
const COOLDOWN_MS = 5000;

// Case drop table — items with rarity weights
const CASE_ITEMS = [
  // Common (weight 40)
  { name: '📦 Обычный приз', value: 50, rarity: 'common', weight: 40, emoji: '📦' },
  { name: '🪙 Горсть монет', value: 100, rarity: 'common', weight: 35, emoji: '🪙' },
  { name: '🍀 Клевер удачи', value: 150, rarity: 'common', weight: 30, emoji: '🍀' },

  // Uncommon (weight 15-20)
  { name: '💎 Кристалл', value: 300, rarity: 'uncommon', weight: 20, emoji: '💎' },
  { name: '🎭 Маска', value: 400, rarity: 'uncommon', weight: 15, emoji: '🎭' },

  // Rare (weight 5-10)
  { name: '👑 Корона', value: 750, rarity: 'rare', weight: 10, emoji: '👑' },
  { name: '🔮 Магический шар', value: 1000, rarity: 'rare', weight: 7, emoji: '🔮' },

  // Epic (weight 2-3)
  { name: '🌟 Звёздная пыль', value: 1500, rarity: 'epic', weight: 3, emoji: '🌟' },
  { name: '⚡ Молния', value: 2000, rarity: 'epic', weight: 2, emoji: '⚡' },

  // Legendary (weight 0.5-1)
  { name: '🦋 Золотая бабочка', value: 5000, rarity: 'legendary', weight: 1, emoji: '🦋' },
  { name: '🏆 Джекпот', value: 10000, rarity: 'legendary', weight: 0.5, emoji: '🏆' },
];

const RARITY_COLORS = {
  common: 0x969696,
  uncommon: 0x2ECC71,
  rare: 0x3498DB,
  epic: 0x9B59B6,
  legendary: 0xF1C40F,
};

const RARITY_NAMES = {
  common: '⬜ Обычный',
  uncommon: '🟩 Необычный',
  rare: '🟦 Редкий',
  epic: '🟪 Эпический',
  legendary: '🟨 Легендарный',
};

// GIF for case opening animation
const CASE_OPEN_GIF = 'https://media1.tenor.com/m/TG4k2yBIA8kAAAAd/treasure-chest-gold.gif';

/**
 * Pick a random item from the drop table using weighted random
 */
function rollCaseItem() {
  const totalWeight = CASE_ITEMS.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of CASE_ITEMS) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }

  return CASE_ITEMS[0]; // fallback
}

export default {
  data: new SlashCommandBuilder()
    .setName('case')
    .setDescription('Система кейсов')
    .addSubcommand(sub =>
      sub.setName('balance')
        .setDescription('Посмотреть ваш баланс 🦋 и количество открытых кейсов')
    )
    .addSubcommand(sub =>
      sub.setName('history')
        .setDescription('История открытых кейсов')
    )
    .addSubcommand(sub =>
      sub.setName('open')
        .setDescription('Открыть кейс')
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'balance':
        return this.handleBalance(interaction, client);
      case 'history':
        return this.handleHistory(interaction, client);
      case 'open':
        return this.handleOpen(interaction, client);
    }
  },

  // ─── /case balance ─────────────────────────────────
  async handleBalance(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    await interaction.deferReply();

    const [mainUser, caseUser] = await Promise.all([
      MainUser.findOne({ guildId, userId }),
      CaseUser.findOne({ guildId, userId }),
    ]);

    const balance = mainUser?.balance ?? 0;
    const casesOpened = caseUser?.cases ?? 0;

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle(`🎰 Баланс — ${interaction.user.displayName}`)
      .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: '🦋 Баланс', value: `**${formatNumber(balance)}**`, inline: true },
        { name: '📦 Кейсов открыто', value: `**${formatNumber(casesOpened)}**`, inline: true },
        { name: '💰 Стоимость кейса', value: `**${formatNumber(CASE_PRICE)}** 🦋`, inline: true },
      )
      .setColor(0x2B2D31)
      .setFooter({ text: `Angelss Cases • ${new Date().toLocaleDateString('ru-RU')}` });

    await interaction.editReply({ embeds: [embed] });
  },

  // ─── /case history ─────────────────────────────────
  async handleHistory(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    await interaction.deferReply();

    const caseUser = await CaseUser.findOne({ guildId, userId });
    const history = caseUser?.history ?? [];

    if (history.length === 0) {
      const embed = new EmbedBuilder().setColor(0x2B2D31)
        .setTitle(`📜 История кейсов — ${interaction.user.displayName}`)
        .setDescription('Вы ещё не открывали кейсы.')
        .setColor(0x2B2D31)
        .setFooter({ text: `Angelss Cases • ${new Date().toLocaleDateString('ru-RU')}` });
      return interaction.editReply({ embeds: [embed] });
    }

    // Show last 15 items, newest first
    const recent = history.slice(-15).reverse();
    const lines = recent.map((entry, i) => {
      const date = formatDate(entry.date);
      return `\`${i + 1}.\` ${entry.item} — *${date}*`;
    });

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle(`📜 История кейсов — ${interaction.user.displayName}`)
      .setDescription(lines.join('\n'))
      .setColor(0x2B2D31)
      .setFooter({ text: `Всего открыто: ${formatNumber(history.length)} кейсов • Angelss Cases` });

    await interaction.editReply({ embeds: [embed] });
  },

  // ─── /case open ────────────────────────────────────
  async handleOpen(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    // Cooldown check
    const cooldownKey = `case_open_${userId}`;
    if (caseCooldown.isOnCooldown(cooldownKey, COOLDOWN_MS)) {
      const remaining = caseCooldown.getRemainingTime(cooldownKey, COOLDOWN_MS);
      return interaction.reply({
        content: `⏳ Подождите ${Math.ceil(remaining / 1000)}с. перед следующим открытием.`,
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const mainUser = await MainUser.findOne({ guildId, userId });
    const balance = mainUser?.balance ?? 0;

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle('🎰 Открытие кейса')
      .setDescription(
        `Стоимость: **${formatNumber(CASE_PRICE)}** 🦋\n` +
        `Ваш баланс: **${formatNumber(balance)}** 🦋\n\n` +
        (balance >= CASE_PRICE
          ? '> Нажмите кнопку ниже, чтобы купить и открыть кейс!'
          : '> ❌ Недостаточно средств для покупки кейса.')
      )
      .setColor(balance >= CASE_PRICE ? 0x2B2D31 : 0xED4245)
      .setFooter({ text: `Angelss Cases • ${new Date().toLocaleDateString('ru-RU')}` });

    const components = [];
    if (balance >= CASE_PRICE) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`buy_case_${userId}`)
          .setLabel(`Купить кейс и открыть — ${formatNumber(CASE_PRICE)} 🦋`)
          .setStyle(ButtonStyle.Success)
          .setEmoji('📦'),
      );
      components.push(row);
    }

    const msg = await interaction.editReply({ embeds: [embed], components });

    // Auto-expire button after 30 seconds
    if (balance >= CASE_PRICE) {
      setTimeout(async () => {
        const key = `case_expire_${msg.id}`;
        if (!caseCooldown.isOnCooldown(key, 1)) {
          caseCooldown.cooldowns.set(key, Date.now());
          const expEmbed = new EmbedBuilder().setColor(0x2B2D31)
            .setTitle('🎰 Открытие кейса')
            .setDescription(`<@${userId}>, время на покупку **вышло**.`)
            .setColor(0x2B2D31);
          await interaction.editReply({ embeds: [expEmbed], components: [] }).catch(() => {});
        }
      }, 30000);
    }
  },

  // ─── Button handler (buy_case_{userId}) ────────────
  async handleButton(interaction) {
    const parts = interaction.customId.split('_');
    const ownerId = parts[2]; // buy_case_{userId}

    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: 'Это не ваш кейс!', flags: 64 });
    }

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    // Prevent double-click
    const clickKey = `case_click_${interaction.message.id}`;
    if (caseCooldown.isOnCooldown(clickKey, 1)) {
      return interaction.reply({ content: 'Этот кейс уже открыт.', ephemeral: true });
    }

    await interaction.deferUpdate();

    // Atomic balance deduction — prevents race conditions
    const updatedUser = await MainUser.findOneAndUpdate(
      { guildId, userId, balance: { $gte: CASE_PRICE } },
      { $inc: { balance: -CASE_PRICE } },
      { new: true },
    );

    if (!updatedUser) {
      const errEmbed = new EmbedBuilder().setColor(0x2B2D31)
        .setTitle('🎰 Открытие кейса')
        .setDescription(`<@${userId}>, недостаточно 🦋!`)
        .setColor(0xED4245);
      return interaction.editReply({ embeds: [errEmbed], components: [] });
    }

    // Step 1: Show opening animation
    const openingEmbed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle('🎰 Открытие кейса...')
      .setDescription('📦 Кейс открывается...')
      .setThumbnail(CASE_OPEN_GIF)
      .setColor(0xFEE75C);

    await interaction.editReply({ embeds: [openingEmbed], components: [] });

    // Step 2: Wait for animation
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Step 3: Roll the item
    const item = rollCaseItem();

    // Step 4: Add winnings to balance
    await MainUser.findOneAndUpdate(
      { guildId, userId },
      { $inc: { balance: item.value } },
    );

    // Step 5: Record in CaseUser history
    await CaseUser.findOneAndUpdate(
      { guildId, userId },
      {
        $inc: { cases: 1 },
        $push: {
          history: {
            item: `${item.emoji} ${item.name} (${formatNumber(item.value)} 🦋)`,
            date: new Date(),
          },
        },
      },
      { upsert: true },
    );

    // Step 6: Calculate net profit/loss
    const net = item.value - CASE_PRICE;
    const netText = net >= 0
      ? `+${formatNumber(net)} 🦋`
      : `${formatNumber(net)} 🦋`;

    // Step 7: Show result
    const resultEmbed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle(`${item.emoji} Кейс открыт!`)
      .setDescription(
        `**${item.name}**\n\n` +
        `${RARITY_NAMES[item.rarity]}\n` +
        `Стоимость: **${formatNumber(item.value)}** 🦋\n` +
        `Итого: **${netText}**\n\n` +
        `Новый баланс: **${formatNumber(updatedUser.balance - CASE_PRICE + item.value)}** 🦋`
      )
      .setColor(RARITY_COLORS[item.rarity])
      .setFooter({ text: `Angelss Cases • ${new Date().toLocaleDateString('ru-RU')}` });

    await interaction.editReply({ embeds: [resultEmbed], components: [] });
  },
};
