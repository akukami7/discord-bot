import { AuditLogEvent } from 'discord.js';
import GuildConfig from '../models/GuildConfig.js';
import { checkRateLimit, triggerAntiCrash } from '../utils/antiCrashCache.js';

export default {
  name: 'channelDelete',
  async execute(channel, client) {
    if (!channel.guild) return;

    try {
      const config = await GuildConfig.findOne({ guildId: channel.guild.id });
      if (!config || !config.antiCrashEnabled) return;

      const auditLogs = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.ChannelDelete,
      });

      const entry = auditLogs.entries.first();
      if (!entry || !entry.executor) return;

      // Check if the deletion is recent (within 20 seconds)
      if (Date.now() - entry.createdTimestamp > 20000) return;

      const executor = entry.executor;
      if (executor.id === client.user.id || executor.bot) return; // Ignored self / bots

      // Fetch the full member object
      const member = await channel.guild.members.fetch(executor.id).catch(() => null);
      if (!member) return;

      // Server owners are immune
      if (channel.guild.ownerId === member.id) return;

      const strikes = checkRateLimit(executor.id);
      if (strikes >= 3) {
        await triggerAntiCrash(channel.guild, member, 'Массовое удаление каналов', client);
      }
    } catch (err) {
      console.error('[AntiCrash] Error in channelDelete event:', err);
    }
  },
};
