import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Points from '../../models/Points.js';
import User from '../../models/User.js';
import { formatNumber, createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('points')
    .setDescription('Баллы модераторов')
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Посмотреть баллы')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('convert')
        .setDescription('Конвертировать баллы')
        .addIntegerOption(option =>
          option.setName('amount').setDescription('Количество баллов').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('shop')
        .setDescription('Магазин за баллы')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Добавить баллы пользователю')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('amount').setDescription('Количество баллов').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason').setDescription('Причина').setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Убрать баллы у пользователя')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('amount').setDescription('Количество баллов').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason').setDescription('Причина').setRequired(false)
        )
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: subcommand !== 'shop' });

    const guildId = interaction.guild.id;

    switch (subcommand) {
      case 'check': {
        const user = interaction.options.getUser('user') || interaction.user;
        const points = await Points.findOne({ guildId, userId: user.id });

        if (!points || points.points === 0) {
          return interaction.editReply({ content: `ℹ️ У пользователя ${user} нет баллов.` });
        }

        const embed = new EmbedBuilder().setColor(0x2B2D31)
          .setColor(client.config.embedAccent)
          .setTitle(`⭐ Баллы: ${user.username}`)
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
        const points = await Points.findOne({ guildId, userId: interaction.user.id });

        if (!points || points.points < amount) {
          return interaction.editReply({ content: `❌ У вас недостаточно баллов. Доступно: ${points ? formatNumber(points.points) : '0'}` });
        }

        // Example conversion: 1 point = 100 coins (you can customize)
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

        await User.findOneAndUpdate(
          { guildId, userId: interaction.user.id },
          { $inc: { balance: coins } },
        );

        const embed = new EmbedBuilder().setColor(0x2B2D31)
          .setColor(0x00FF00)
          .setTitle('✅ Конвертация выполнена')
          .setDescription(`Вы конвертировали **${formatNumber(amount)}** баллов в **${formatNumber(coins)}** монет.`)
          .setFooter({ text: createFooter() });

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'shop': {
        // Example shop items
        const shopItems = [
          { name: '🎨 Кастомная роль', price: 500, description: 'Создание уникальной роли' },
          { name: '🎵 Музыкальный бот', price: 200, description: 'Доступ к музыкальному боту на 24ч' },
          { name: '⭐ VIP статус', price: 1000, description: 'VIP статус на 7 дней' },
          { name: '🎁 Подарочный набор', price: 300, description: 'Случайный предмет из магазина' },
        ];

        const description = shopItems.map((item, i) =>
          `**${i + 1}.** ${item.name} • **${formatNumber(item.price)}** баллов\n${item.description}`
        ).join('\n');

        const embed = new EmbedBuilder().setColor(0x2B2D31)
          .setColor(client.config.embedAccent)
          .setTitle('🛒 Магазин за баллы')
          .setDescription(description)
          .setFooter({ text: createFooter() });

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'add': {
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || 'Администратор добавил';

        let points = await Points.findOne({ guildId, userId: user.id });
        if (!points) {
          points = new Points({ guildId, userId: user.id, points: 0, earnedPoints: 0, spentPoints: 0 });
        }

        points.points += amount;
        points.earnedPoints += amount;
        points.history.push({
          action: 'admin_add',
          amount: amount,
          reason,
          moderatorId: interaction.user.id,
        });
        await points.save();

        const embed = new EmbedBuilder().setColor(0x2B2D31)
          .setColor(0x00FF00)
          .setTitle('✅ Баллы добавлены')
          .setDescription(`Добавлено **${formatNumber(amount)}** баллов для ${user}.`)
          .addFields(
            { name: 'Причина', value: reason, inline: false },
            { name: 'Новый баланс', value: `**${formatNumber(points.points)}**`, inline: true }
          )
          .setFooter({ text: createFooter() });

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'remove': {
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || 'Администратор убрал';

        const points = await Points.findOne({ guildId, userId: user.id });
        if (!points || points.points < amount) {
          return interaction.editReply({ content: `❌ У пользователя недостаточно баллов. Доступно: ${points ? formatNumber(points.points) : '0'}` });
        }

        points.points -= amount;
        points.spentPoints += amount;
        points.history.push({
          action: 'admin_remove',
          amount: -amount,
          reason,
          moderatorId: interaction.user.id,
        });
        await points.save();

        const embed = new EmbedBuilder().setColor(0x2B2D31)
          .setColor(0xFF0000)
          .setTitle('❌ Баллы убраны')
          .setDescription(`Убрано **${formatNumber(amount)}** баллов у ${user}.`)
          .addFields(
            { name: 'Причина', value: reason, inline: false },
            { name: 'Новый баланс', value: `**${formatNumber(points.points)}**`, inline: true }
          )
          .setFooter({ text: createFooter() });

        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
