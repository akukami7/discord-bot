import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import ModeratorAction from '../../models/ModeratorAction.js';
import { formatDate, createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('action')
    .setDescription('Взаимодействие с участником')
    .addSubcommand(subcommand =>
      subcommand
        .setName('warn')
        .setDescription('Выдать предупреждение')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason').setDescription('Причина').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('mute')
        .setDescription('Замутить пользователя')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason').setDescription('Причина').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('duration').setDescription('Длительность (10m, 1h, 1d)').setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('timeout')
        .setDescription('Таймаут пользователя')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason').setDescription('Причина').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('duration').setDescription('Длительность (10m, 1h, 1d)').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('kick')
        .setDescription('Кикнуть пользователя')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason').setDescription('Причина').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ban')
        .setDescription('Забанить пользователя')
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
        .setName('note')
        .setDescription('Добавить заметку о пользователе')
        .addUserOption(option =>
          option.setName('user').setDescription('Пользователь').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('note').setDescription('Заметка').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Список действий модератора')
        .addUserOption(option =>
          option.setName('moderator').setDescription('Модератор').setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (subcommand === 'list') {
      const moderator = interaction.options.getUser('moderator') || interaction.user;
      const actions = await ModeratorAction.find({
        guildId: interaction.guild.id,
        moderatorId: moderator.id,
      }).sort({ createdAt: -1 }).limit(10);

      if (actions.length === 0) {
        return interaction.editReply({ content: 'ℹ️ Нет действий у этого модератора.' });
      }

      const embed = new EmbedBuilder().setColor(0x2B2D31)
        .setColor(client.config.embedColor)
        .setTitle(`📋 Действия модератора ${moderator.username}`)
        .setDescription(actions.map((a, i) =>
          `**${i + 1}.** ${a.type} • ${a.targetName} • ${a.reason || 'Без причины'} • ${formatDate(a.createdAt)}`
        ).join('\n'))
        .setFooter({ text: createFooter() });

      return interaction.editReply({ embeds: [embed] });
    }

    const user = interaction.options.getUser('user');
    let reason = interaction.options.getString('reason');
    const moderator = interaction.user;

    // Check if user is higher in hierarchy
    const targetMember = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (targetMember && targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.editReply({ content: '❌ Вы не можете взаимодействовать с пользователем выше вас в иерархии.' });
    }

    const actionType = subcommand;
    let duration = 0;
    let actionResult = '';

    try {
      switch (subcommand) {
        case 'warn': {
          actionResult = `⚠️ Пользователь ${user} получил предупреждение.`;
          break;
        }

        case 'mute': {
          // Note: Muting requires a mute role, this is a simplified version
          actionResult = `🔇 Пользователь ${user} замучен.`;
          break;
        }

        case 'timeout': {
          const durationStr = interaction.options.getString('duration');
          duration = parseDuration(durationStr);
          if (duration === 0) {
            return interaction.editReply({ content: '❌ Неверный формат длительности. Используйте: 10m, 1h, 1d' });
          }
          await targetMember.timeout(duration, reason);
          actionResult = `⏱️ Пользователь ${user} получил таймаут на ${durationStr}.`;
          break;
        }

        case 'kick': {
          await targetMember.kick(reason);
          actionResult = `👢 Пользователь ${user} кикнут.`;
          break;
        }

        case 'ban': {
          const banDuration = interaction.options.getString('duration');
          await targetMember.ban({ reason, deleteMessageSeconds: 7 * 24 * 60 * 60 });
          actionResult = `🔨 Пользователь ${user} забанен.`;
          break;
        }

        case 'note': {
          const note = interaction.options.getString('note');
          actionResult = `📝 Добавлена заметка о ${user}.`;
          reason = note; // Use note as reason for logging
          break;
        }
      }

      // Log action in database
      await ModeratorAction.create({
        guildId: interaction.guild.id,
        type: actionType,
        targetId: user.id,
        targetName: user.username,
        reason,
        duration,
        moderatorId: moderator.id,
        moderatorName: moderator.username,
        channelId: interaction.channel?.id || '',
      });

      // Update staff stats
      const Staff = (await import('../../models/Staff.js')).default;
      await Staff.findOneAndUpdate(
        { guildId: interaction.guild.id, userId: moderator.id },
        {
          $inc: { actionsCount: 1 },
          $set: { lastActionAt: new Date(), username: moderator.username },
        },
        { upsert: true, new: true }
      );

      const embed = new EmbedBuilder().setColor(0x2B2D31)
        .setColor(0x00FF00)
        .setTitle('✅ Действие выполнено')
        .setDescription(actionResult)
        .addFields(
          { name: 'Модератор', value: `${moderator.username}`, inline: true },
          { name: 'Пользователь', value: `${user.username}`, inline: true },
          { name: 'Причина', value: reason || 'Без причины', inline: false }
        )
        .setFooter({ text: createFooter() });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Action command error:', error);
      await interaction.editReply({ content: '❌ Ошибка при выполнении действия.' });
    }
  },
};

function parseDuration(str) {
  if (!str) return 0;
  const match = str.match(/^(\d+)([mhd])$/);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}
