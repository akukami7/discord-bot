import { AuditLogEvent } from 'discord.js';
import GuildConfig from '../../models/GuildConfig.js';
import { checkRateLimit, triggerAntiCrash } from '../../utils/antiCrashCache.js';

export default {
  name: 'roleDelete',
  async execute(role, client) {
    if (!role.guild) return;

    try {
      const config = await GuildConfig.findOne({ guildId: role.guild.id });
      if (!config || !config.antiCrashEnabled) return;

      const auditLogs = await role.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.RoleDelete,
      });

      const entry = auditLogs.entries.first();
      if (!entry || !entry.executor) return;

      // Check if the deletion is recent (within 20 seconds)
      if (Date.now() - entry.createdTimestamp > 20000) return;

      const executor = entry.executor;
      if (executor.id === client.user.id || executor.bot) return; // Ignored self / bots

      const member = await role.guild.members.fetch(executor.id).catch(() => null);
      if (!member) return;

      // Server owners are immune
      if (role.guild.ownerId === member.id) return;

      const strikes = checkRateLimit(executor.id);
      if (strikes >= 3) {
        await triggerAntiCrash(role.guild, member, 'Массовое удаление ролей', client);
      }
    } catch (err) {
      console.error('[AntiCrash] Error in roleDelete event:', err);
    }
  },
};
