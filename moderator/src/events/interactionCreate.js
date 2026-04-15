import { Events, EmbedBuilder } from 'discord.js';
import Staff from '../models/Staff.js';
import MessageStats from '../models/MessageStats.js';
import ModeratorAction from '../models/ModeratorAction.js';
import Report from '../models/Report.js';
import BlacklistEntry from '../models/BlacklistEntry.js';
import { formatNumber, formatTime, createFooter } from '../utils/helpers.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing /${interaction.commandName}:`, error);
        const payload = { content: '❌ Произошла ошибка при выполнении команды.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
      return;
    }

    // Handle panel buttons
    if (interaction.isButton() && interaction.customId.startsWith('panel_')) {
      await interaction.deferReply({ ephemeral: true });
      const guildId = interaction.guild.id;

      switch (interaction.customId) {
        case 'panel_stats': {
          const [totalMembers, totalStaff, totalActions, totalReports] = await Promise.all([
            interaction.guild.memberCount,
            Staff.countDocuments({ guildId }),
            ModeratorAction.countDocuments({ guildId }),
            Report.countDocuments({ guildId }),
          ]);

          const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle('📊 Статистика сервера')
            .addFields(
              { name: 'Всего участников', value: `**${formatNumber(totalMembers)}**`, inline: true },
              { name: 'В составе', value: `**${totalStaff}**`, inline: true },
              { name: 'Действий модераторов', value: `**${formatNumber(totalActions)}**`, inline: true },
              { name: 'Жалоб', value: `**${totalReports}**`, inline: true }
            )
            .setFooter({ text: createFooter() });

          await interaction.editReply({ embeds: [embed] });
          break;
        }

        case 'panel_staff': {
          const staffList = await Staff.find({ guildId, status: 'active' })
            .sort({ rankLevel: -1, points: -1 })
            .limit(15);

          if (staffList.length === 0) {
            return interaction.editReply({ content: 'ℹ️ В составе нет активных модераторов.' });
          }

          const description = staffList.map((s, i) => {
            const member = interaction.guild.members.cache.get(s.userId);
            const username = member ? member.user.username : s.username || 'Unknown';
            return `**${i + 1}.** ${username} • ${s.rank} • ${s.points} баллов`;
          }).join('\n');

          const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle('👥 Состав модераторов')
            .setDescription(description)
            .setFooter({ text: createFooter() });

          await interaction.editReply({ embeds: [embed] });
          break;
        }

        case 'panel_reports': {
          const pendingReports = await Report.find({ guildId, status: 'pending' })
            .sort({ createdAt: -1 })
            .limit(10);

          if (pendingReports.length === 0) {
            return interaction.editReply({ content: 'ℹ️ Нет ожидающих жалоб.' });
          }

          const description = pendingReports.map((r, i) =>
            `**${i + 1}.** ${r.reportedName} от ${r.reporterName} • ${r.reason} • <t:${Math.floor(r.createdAt.getTime() / 1000)}:R>`
          ).join('\n');

          const embed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('📝 Ожидающие жалобы')
            .setDescription(description)
            .setFooter({ text: createFooter() });

          await interaction.editReply({ embeds: [embed] });
          break;
        }

        case 'panel_actions': {
          const actions = await ModeratorAction.find({ guildId })
            .sort({ createdAt: -1 })
            .limit(10);

          if (actions.length === 0) {
            return interaction.editReply({ content: 'ℹ️ Нет действий модераторов.' });
          }

          const description = actions.map((a, i) =>
            `**${i + 1}.** ${a.type} • ${a.targetName} • ${a.moderatorName} • <t:${Math.floor(a.createdAt.getTime() / 1000)}:R>`
          ).join('\n');

          const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle('🛡️ Последние действия')
            .setDescription(description)
            .setFooter({ text: createFooter() });

          await interaction.editReply({ embeds: [embed] });
          break;
        }

        case 'panel_blacklist': {
          const blacklistEntries = await BlacklistEntry.find({ guildId, isActive: true })
            .sort({ addedAt: -1 })
            .limit(10);

          if (blacklistEntries.length === 0) {
            return interaction.editReply({ content: 'ℹ️ Чёрный список пуст.' });
          }

          const description = blacklistEntries.map((e, i) =>
            `**${i + 1}.** ${e.username} • ${e.reason} • ${e.addedByName}`
          ).join('\n');

          const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🚫 Чёрный список')
            .setDescription(description)
            .setFooter({ text: createFooter() });

          await interaction.editReply({ embeds: [embed] });
          break;
        }

        default:
          await interaction.editReply({ content: '❌ Неизвестное действие.' });
      }
    }
  },
};
