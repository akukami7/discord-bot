import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Transaction from '../../models/Transaction.js';
import { formatNumber } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('transaction')
    .setDescription('Посмотреть транзакции')
    .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(false)),
  async execute(interaction, client) {
    const target = interaction.options.getUser('user') || interaction.user;
    await interaction.deferReply();
    await showPage(interaction, client, target, 0);
  },

  async handleButton(interaction, client) {
    const [, userId, pageStr] = interaction.customId.split('_').slice(1);
    const page = parseInt(pageStr);
    const target = await client.users.fetch(userId).catch(() => null);
    if (!target) return interaction.reply({ content: 'Пользователь не найден.', ephemeral: true });
    await interaction.deferUpdate();
    await showPage(interaction, client, target, page, true);
  },
};

async function showPage(interaction, client, target, page, isEdit = false) {
  const guildId = interaction.guild.id;
  const perPage = 10;

  const total = await Transaction.countDocuments({
    guildId,
    $or: [{ fromId: target.id }, { toId: target.id }]
  });

  const transactions = await Transaction.find({
    guildId,
    $or: [{ fromId: target.id }, { toId: target.id }]
  })
    .sort({ createdAt: -1 })
    .skip(page * perPage)
    .limit(perPage);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const lines = transactions.map((t, i) => {
    const num = page * perPage + i + 1;
    const sign = t.amount >= 0 ? '+' : '';
    const date = t.createdAt.toLocaleDateString('ru-RU');
    return `\`${num}.\` ${t.description} (**${sign}${formatNumber(t.amount)}** 💰) — ${date}`;
  });

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Транзакции ${target.displayName}`, iconURL: target.displayAvatarURL() })
    .setDescription(lines.length ? lines.join('\n') : 'Нет транзакций.')
    .setFooter({ text: `Страница ${page + 1}/${totalPages} • Всего: ${total}` })
    .setColor(client.config.embedColor);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tx_page_${target.id}_${page - 1}`)
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(`tx_page_${target.id}_${page + 1}`)
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );

  if (isEdit) {
    await interaction.editReply({ embeds: [embed], components: [row] });
  } else {
    await interaction.editReply({ embeds: [embed], components: [row] });
  }
}
