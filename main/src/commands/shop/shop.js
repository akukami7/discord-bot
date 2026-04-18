import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import ShopItem from '../../models/ShopItem.js';
import Inventory from '../../models/Inventory.js';
import User from '../../models/User.js';
import Transaction from '../../models/Transaction.js';
import { formatNumber } from '../../utils/helpers.js';

const CATEGORY_OPTIONS = [
  { label: 'Личные роли', value: 'role', emoji: '🛡️' },
  { label: 'Общее', value: 'other', emoji: '🛡️' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Магазин'),
  async execute(interaction, client) {
    await interaction.deferReply();
    await showShopPage(interaction, client, 0, 'other'); // Default to other
  },

  async handleButton(interaction, client) {
    const parts = interaction.customId.split('_');

    if (parts[1] === 'page') {
      const page = parseInt(parts[2]);
      const category = parts[3] || 'other';
      await interaction.deferUpdate();
      await showShopPage(interaction, client, page, category, true);
    }

    if (parts[1] === 'buy') {
      const itemId = parts[2];
      await interaction.deferReply({ ephemeral: true });

      const item = await ShopItem.findById(itemId);
      if (!item || !item.isActive) return interaction.editReply('Товар не найден.');

      const guildId = interaction.guild.id;
      const userId = interaction.user.id;

      const currencyField = item.currency === 'standart' ? 'donate' : 'balance';
      const currencyEmoji = item.currency === 'standart' ? '👑' : '🦋';

      const user = await User.findOneAndUpdate(
        { guildId, userId, [currencyField]: { $gte: item.price } },
        { $inc: { [currencyField]: -item.price } }
      );

      if (!user) {
        return interaction.editReply(`Недостаточно ${currencyEmoji}!`);
      }

      // Check if already owns
      const owned = await Inventory.findOne({ guildId, userId, itemId: item._id });
      if (owned) return interaction.editReply('У вас уже есть этот предмет!');

      // If it's a role, give it to the user
      const roleId = item.roleId || (item.data && item.data.roleId);
      if (item.type === 'role' && roleId) {
        const role = interaction.guild.roles.cache.get(roleId);
        if (role) {
          await interaction.member.roles.add(role).catch(err => console.error('Не удалось выдать роль:', err));
        } else {
          return interaction.editReply('Не удалось найти роль на сервере. Обратитесь к администратору!');
        }
      }

      // Balance was already deducted atomically above

      await Inventory.create({ guildId, userId, itemId: item._id });

      // Increment purchases
      await ShopItem.findByIdAndUpdate(itemId, { $inc: { purchases: 1 } });

      await Transaction.create({
        guildId,
        fromId: userId,
        amount: -item.price,
        type: 'shop',
        description: `Покупка: ${item.name}`,
      });

      await interaction.editReply(`✅ Вы купили **${item.name}** за **${formatNumber(item.price)}** ${currencyEmoji}!`);
    }
  },

  async handleSelectMenu(interaction, client) {
    const customId = interaction.customId;
    const value = interaction.values[0];

    await interaction.deferUpdate();

    if (customId.startsWith('shop_cat_')) {
      await showShopPage(interaction, client, 0, value, true);
    }
  },
};

async function showShopPage(interaction, client, page, category = 'all', isEdit = false) {
  const guildId = interaction.guild.id;
  const perPage = 5;

  const filter = { guildId, isActive: true };

  const total = await ShopItem.countDocuments(filter);
  const items = await ShopItem.find(filter)
    .sort({ purchases: -1, createdAt: -1 })
    .skip(page * perPage)
    .limit(perPage);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const lines = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const num = page * perPage + i + 1;
    const currencyEmoji = item.currency === 'standart' ? '👑' : '🦋';

    const itemName = item.type === 'role' && item.roleId ? `<@&${item.roleId}>` : item.name;
    const itemPrice = formatNumber(item.price);
    const itemDesc = item.data?.description || 'Без описания';

    lines.push(
      `**${num}. ${itemName}**\n` +
      `— ${itemPrice} ${currencyEmoji}\n` +
      `| ${itemDesc}`
    );
  }

  const embedTitle = '🛒 Магазин';
  let fullDescription = lines.length ? lines.join('\n\n') : 'Магазин пуст. Товары ещё не добавлены.';

  fullDescription += `\n\nСтраница ${page + 1}/${totalPages} • Всего товаров: ${total}`;

  const embed = new EmbedBuilder().setColor(0x2B2D31)
    .setTitle(embedTitle)
    .setDescription(fullDescription)
    .setColor(0x2B2D31);

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`shop_page_${page - 1}_${category}_prev`)
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(`shop_page_${page + 1}_${category}_next`)
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );

  const buyButtons = items.map((item, i) => {
    const num = page * perPage + i + 1;
    return new ButtonBuilder()
      .setCustomId(`shop_buy_${item._id}`)
      .setLabel(`Купить #${num}`)
      .setStyle(ButtonStyle.Success);
  });

  const linkRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Купить спонсорку')
      .setEmoji('💎')
      .setURL('https://t.me/angelsssssssssssssssssssssssss')
      .setStyle(ButtonStyle.Link)
  );

  const components = [];

  components.push(navRow);

  if (buyButtons.length > 0) {
    components.push(new ActionRowBuilder().addComponents(...buyButtons));
  }

  components.push(linkRow);

  if (isEdit) {
    await interaction.editReply({ embeds: [embed], components });
  } else {
    await interaction.editReply({ embeds: [embed], components });
  }
}

