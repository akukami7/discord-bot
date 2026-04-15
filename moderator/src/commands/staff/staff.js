import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import BlacklistEntry from '../../models/BlacklistEntry.js';
import { formatDate, createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Управление составом')
    .addSubcommandGroup(group =>
      group
        .setName('blacklist')
        .setDescription('Чёрный список')
        .addSubcommand(subcommand =>
          subcommand
            .setName('add')
            .setDescription('Добавить в чёрный список')
            .addUserOption(option =>
              option.setName('user').setDescription('Пользователь').setRequired(true)
            )
            .addStringOption(option =>
              option.setName('reason').setDescription('Причина').setRequired(true)
            )
            .addStringOption(option =>
              option.setName('duration').setDescription('Длительность (1d, 7d, permanent)').setRequired(false)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('remove')
            .setDescription('Убрать из чёрного списка')
            .addUserOption(option =>
              option.setName('user').setDescription('Пользователь').setRequired(true)
            )
            .addStringOption(option =>
              option.setName('reason').setDescription('Причина').setRequired(false)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('check')
            .setDescription('Проверить чёрный список')
            .addUserOption(option =>
              option.setName('user').setDescription('Пользователь').setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('show')
            .setDescription('Показать чёрный список')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('promote')
        .setDescription('Повысить модератора')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('demote')
        .setDescription('Понизить модератора')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Информация о модераторе')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('profile')
        .setDescription('Профиль модератора')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;
    const Staff = (await import('../../models/Staff.js')).default;

    if (subcommandGroup === 'blacklist') {
      await handleBlacklist(interaction, subcommand, guildId);
    } else if (subcommand === 'promote') {
      await handlePromote(interaction, guildId, Staff);
    } else if (subcommand === 'demote') {
      await handleDemote(interaction, guildId, Staff);
    } else if (subcommand === 'info') {
      await handleInfo(interaction, guildId, Staff);
    } else if (subcommand === 'profile') {
      await handleProfile(interaction, guildId, Staff);
    }
  },
};

async function handleBlacklist(interaction, subcommand, guildId) {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason');

  switch (subcommand) {
    case 'add': {
      const duration = interaction.options.getString('duration');
      let expiresAt = null;

      if (duration && duration !== 'permanent') {
        const match = duration.match(/^(\d+)([d])$/);
        if (match) {
          const days = parseInt(match[1]);
          expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }
      }

      const existing = await BlacklistEntry.findOne({ guildId, userId: user.id, isActive: true });
      if (existing) {
        return interaction.editReply({ content: `❌ Пользователь ${user} уже в чёрном списке.` });
      }

      await BlacklistEntry.create({
        guildId,
        userId: user.id,
        username: user.username,
        reason,
        addedBy: interaction.user.id,
        addedByName: interaction.user.username,
        expiresAt,
      });

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚫 Добавлен в чёрный список')
        .setDescription(`Пользователь **${user.username}** добавлен в чёрный список.`)
        .addFields(
          { name: 'Причина', value: reason, inline: false },
          { name: 'Добавил', value: interaction.user.username, inline: true },
          { name: 'Истекает', value: expiresAt ? formatDate(expiresAt) : 'Никогда', inline: true }
        )
        .setFooter({ text: createFooter() });

      return interaction.editReply({ embeds: [embed] });
    }

    case 'remove': {
      const entry = await BlacklistEntry.findOne({ guildId, userId: user.id, isActive: true });
      if (!entry) {
        return interaction.editReply({ content: `ℹ️ Пользователь ${user} не в чёрном списке.` });
      }

      entry.isActive = false;
      entry.removedAt = new Date();
      entry.removedBy = interaction.user.id;
      entry.removedByName = interaction.user.username;
      entry.notes = reason || entry.notes;
      await entry.save();

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Убран из чёрного списка')
        .setDescription(`Пользователь **${user.username}** убран из чёрного списка.`)
        .addFields(
          { name: 'Причина', value: reason || 'Не указана', inline: false },
          { name: 'Убрал', value: interaction.user.username, inline: true }
        )
        .setFooter({ text: createFooter() });

      return interaction.editReply({ embeds: [embed] });
    }

    case 'check': {
      const entries = await BlacklistEntry.find({ guildId, userId: user.id })
        .sort({ addedAt: -1 }).limit(5);

      const activeEntries = entries.filter(e => e.isActive);

      if (activeEntries.length === 0) {
        return interaction.editReply({ content: `ℹ️ Пользователь ${user} не в чёрном списке.` });
      }

      const description = activeEntries.map((e, i) =>
        `**${i + 1}.** ${e.reason} • ${e.addedByName} • ${formatDate(e.addedAt)}${e.expiresAt ? ` • Истекает: ${formatDate(e.expiresAt)}` : ''}`
      ).join('\n');

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`🚫 Чёрный список: ${user.username}`)
        .setDescription(description)
        .setFooter({ text: createFooter() });

      return interaction.editReply({ embeds: [embed] });
    }

    case 'show': {
      const entries = await BlacklistEntry.find({ guildId, isActive: true })
        .sort({ addedAt: -1 }).limit(15);

      if (entries.length === 0) {
        return interaction.editReply({ content: 'ℹ️ Чёрный список пуст.' });
      }

      const description = entries.map((e, i) =>
        `**${i + 1}.** ${e.username} • ${e.reason} • ${e.addedByName} • ${formatDate(e.addedAt)}`
      ).join('\n');

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚫 Чёрный список')
        .setDescription(description.length > 4096 ? description.slice(0, 4093) + '...' : description)
        .setFooter({ text: createFooter() });

      return interaction.editReply({ embeds: [embed] });
    }
  }
}

async function handlePromote(interaction, guildId, Staff) {
  const user = interaction.options.getUser('user');

  let staff = await Staff.findOne({ guildId, userId: user.id });
  if (!staff) {
    staff = new Staff({ guildId, userId: user.id, username: user.username });
  }

  const ranks = [
    'Младший модератор',
    'Модератор',
    'Старший модератор',
    'Администратор',
    'Главный администратор'
  ];

  const currentRankIndex = ranks.indexOf(staff.rank);
  if (currentRankIndex >= ranks.length - 1) {
    return interaction.editReply({ content: `❌ У пользователя ${user} уже максимальный ранг.` });
  }

  const newRank = ranks[currentRankIndex + 1];
  staff.rank = newRank;
  staff.rankLevel = currentRankIndex + 2;
  await staff.save();

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('⬆️ Повышение')
    .setDescription(`Пользователь **${user.username}** повышен до **${newRank}**.`)
    .setFooter({ text: createFooter() });

  await interaction.editReply({ embeds: [embed] });
}

async function handleDemote(interaction, guildId, Staff) {
  const user = interaction.options.getUser('user');

  let staff = await Staff.findOne({ guildId, userId: user.id });
  if (!staff) {
    return interaction.editReply({ content: `ℹ️ Пользователь ${user} не в составе.` });
  }

  const ranks = [
    'Младший модератор',
    'Модератор',
    'Старший модератор',
    'Администратор',
    'Главный администратор'
  ];

  const currentRankIndex = ranks.indexOf(staff.rank);
  if (currentRankIndex <= 0) {
    return interaction.editReply({ content: `❌ У пользователя ${user} уже минимальный ранг.` });
  }

  const newRank = ranks[currentRankIndex - 1];
  staff.rank = newRank;
  staff.rankLevel = currentRankIndex;
  await staff.save();

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('⬇️ Понижение')
    .setDescription(`Пользователь **${user.username}** понижен до **${newRank}**.`)
    .setFooter({ text: createFooter() });

  await interaction.editReply({ embeds: [embed] });
}

async function handleInfo(interaction, guildId, Staff) {
  const user = interaction.options.getUser('user');

  const staff = await Staff.findOne({ guildId, userId: user.id });
  if (!staff) {
    return interaction.editReply({ content: `ℹ️ Пользователь ${user} не в составе.` });
  }

  const embed = new EmbedBuilder()
    .setColor(client?.config?.embedColor || 0x2f3136)
    .setTitle(`📋 Информация: ${user.username}`)
    .addFields(
      { name: 'Ранг', value: staff.rank, inline: true },
      { name: 'Статус', value: staff.status === 'active' ? '✅ Активен' : staff.status === 'inactive' ? '⏸️ Неактивен' : '🚫 Приостановлен', inline: true },
      { name: 'Баллы', value: `**${staff.points}**`, inline: true },
      { name: 'Действия', value: `**${staff.actionsCount}**`, inline: true },
      { name: 'Сообщения', value: `**${staff.messagesCount}**`, inline: true },
      { name: 'В верификациях', value: `**${staff.verificationsCount}**`, inline: true },
      { name: 'В наборах', value: `**${staff.recruitmentsCount}**`, inline: true },
      { name: 'В голосе', value: `**${Math.floor(staff.voiceOnline / 3600)}ч**`, inline: true },
      { name: 'В составе с', value: formatDate(staff.hiredAt), inline: false }
    )
    .setFooter({ text: createFooter() });

  await interaction.editReply({ embeds: [embed] });
}

async function handleProfile(interaction, guildId, Staff) {
  const user = interaction.options.getUser('user') || interaction.user;

  const staff = await Staff.findOne({ guildId, userId: user.id });
  if (!staff) {
    return interaction.editReply({ content: `ℹ️ Пользователь ${user} не в составе.` });
  }

  const embed = new EmbedBuilder()
    .setColor(client?.config?.embedAccent || 0x5865F2)
    .setTitle(`👤 Профиль: ${user.username}`)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: '🎖️ Ранг', value: staff.rank, inline: true },
      { name: '⭐ Баллы', value: `**${staff.points}**`, inline: true },
      { name: '📊 Статус', value: staff.status === 'active' ? '✅ Активен' : staff.status === 'inactive' ? '⏸️ Неактивен' : '🚫 Приостановлен', inline: true },
      { name: '🛡️ Действия', value: `**${staff.actionsCount}**`, inline: true },
      { name: '💬 Сообщения', value: `**${staff.messagesCount}**`, inline: true },
      { name: '🎙️ Голос', value: `**${Math.floor(staff.voiceOnline / 3600)}ч**`, inline: true }
    )
    .setFooter({ text: createFooter() });

  await interaction.editReply({ embeds: [embed] });
}
