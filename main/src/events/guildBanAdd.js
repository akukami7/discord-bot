import { AuditLogEvent } from 'discord.js';
import GuildConfig from '../models/GuildConfig.js';
import { checkRateLimit, triggerAntiCrash } from '../utils/antiCrashCache.js';

export default {
  name: 'guildBanAdd',
  async execute(ban, client) {
    if (!ban.guild) return;

    try {
      const config = await GuildConfig.findOne({ guildId: ban.guild.id });
      if (!config || !config.antiCrashEnabled) return;

      const auditLogs = await ban.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd,
      });

      const entry = auditLogs.entries.first();
      if (!entry || !entry.executor) return;

      // Check if the ban is recent (within 20 seconds)
      if (Date.now() - entry.createdTimestamp > 20000) return;

      const executor = entry.executor;
      if (executor.id === client.user.id || executor.bot) return; // Ignored self / bots

      // Fetch the full member object (who issued the ban)
      const member = await ban.guild.members.fetch(executor.id).catch(() => null);
      if (!member) return;

      // Server owners are immune
      if (ban.guild.ownerId === member.id) return;

      const strikes = checkRateLimit(executor.id);
      if (strikes >= 3) {
        await triggerAntiCrash(ban.guild, member, 'Массовые баны участников', client);
      }
    } catch (err) {
      console.error('[AntiCrash] Error in guildBanAdd event:', err);
    }
  },
};
