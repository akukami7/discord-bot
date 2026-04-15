import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Points from '../../models/Points.js';
import { formatNumber, createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('my-points')
    .setDescription('Мои баллы')
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Посмотреть свои баллы')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('convert')
        .setDescription('Конвертировать баллы в монеты')
        .addIntegerOption(option =>
          option.setName('amount').setDescription('Количество баллов').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('shop')
        .setDescription('Магазин за баллы')
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: subcommand !== 'shop' });

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    switch (subcommand) {
      case 'check': {
        const points = await Points.findOne({ guildId, userId });

        if (!points || points.points === 0) {
          return interaction.editReply({ content: 'ℹ️ У вас нет баллов.' });
        }

        const embed = new EmbedBuilder()
          .setColor(client.config.embedAccent)
          .setTitle(`⭐ Ваши баллы`)
          .addFields(
            { name: 'Доступно', value: `**${formatNumber(points.points)}**`, inline: true },
            { name: 'Всего заработано', value: `**${formatNumber(points.earnedPoints)}**`, inline: true },
            { name: 'Всего потрачено', value: `**${formatNumber(points.spentPoints)}**`, inline: true }
          )
          .setFooter({ text: createFooter() });

        if (points.history.length > 0) {
          const recentHistory = points.history.slice(-5).map(h =>
            `**${h.action}** • ${h.amount > 0 ? '+' : ''}${h.amount} • ${h.reason || 'Без причины'} • ${new Date(h.timestamp).toLocaleString('ru-RU')}`
          ).join('\n');
          embed.addFields({ name: 'Последние операции', value: recentHistory, inline: false });
        }

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'convert': {
        const amount = interaction.options.getInteger('amount');
        const points = await Points.findOne({ guildId, userId });

        if (!points || points.points < amount) {
          return interaction.editReply({ content: `❌ У вас недостаточно баллов. Доступно: ${points ? formatNumber(points.points) : '0'}` });
        }

        const conversionRate = 100;
        const coins = amount * conversionRate;

        points.points -= amount;
        points.spentPoints += amount;
        points.history.push({
          action: 'convert',
          amount: -amount,
          reason: `Конвертация в ${formatNumber(coins)} монет`,
        });
        await points.save();

        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Конвертация выполнена')
          .setDescription(`Вы конвертировали **${formatNumber(amount)}** баллов в **${formatNumber(coins)}** монет.`)
          .setFooter({ text: createFooter() });

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'shop': {
        const shopItems = [
          { name: '🎨 Кастомная роль', price: 500, description: 'Создание уникальной роли' },
          { name: '🎵 Музыкальный бот', price: 200, description: 'Доступ к музыкальному боту на 24ч' },
          { name: '⭐ VIP статус', price: 1000, description: 'VIP статус на 7 дней' },
          { name: '🎁 Подарочный набор', price: 300, description: 'Случайный предмет из магазина' },
        ];

        const description = shopItems.map((item, i) =>
          `**${i + 1}.** ${item.name} • **${formatNumber(item.price)}** баллов\n${item.description}`
        ).join('\n');

        const embed = new EmbedBuilder()
          .setColor(client.config.embedAccent)
          .setTitle('🛒 Магазин за баллы')
          .setDescription(description)
          .setFooter({ text: createFooter() });

        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
