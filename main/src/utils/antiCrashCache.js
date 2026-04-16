import { EmbedBuilder } from 'discord.js';
import GuildConfig from '../models/GuildConfig.js';

// rate limit cache: userId -> Array of timestamps
const rateLimits = new Map();

export const checkRateLimit = (userId) => {
  const now = Date.now();
  let timestamps = rateLimits.get(userId) || [];

  // Filter out timestamps older than 60 seconds
  timestamps = timestamps.filter(t => now - t < 60000);
  timestamps.push(now);

  rateLimits.set(userId, timestamps);
  return timestamps.length;
};

export const clearRateLimit = (userId) => {
  rateLimits.delete(userId);
};

export const triggerAntiCrash = async (guild, member, reason, client) => {
  if (!member || !guild) return;

  clearRateLimit(member.id);

  console.log(`[AntiCrash] Triggered for user ${member.id} (${member.user?.tag}) - Reason: ${reason}`);

  try {
    // Attempt to ban the user. (Note: bot must have higher role than the user, and user cannot be Server Owner)
    await member.ban({ reason: `Автоматический AntiCrash: ${reason} (Массовые действия)` });
  } catch (err) {
    console.error(`[AntiCrash] Failed to ban ${member.id}:`, err.message);
  }

  // Try to log what happened
  try {
    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (config && config.antiCrashLogChannel) {
      const channel = guild.channels.cache.get(config.antiCrashLogChannel) || await guild.channels.fetch(config.antiCrashLogChannel).catch(() => null);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle('🚨 СИСТЕМА АНТИКРАШ 🚨')
          .setThumbnail(member.user?.displayAvatarURL({ dynamic: true }) || null)
          .setDescription(`**Нарушитель:** <@${member.id}> (\`${member.id}\`)\n**Наказание:** Бан\n**Причина:** ${reason} (Более 3 действий за 60с)`)
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('[AntiCrash] Failed to send log:', err.message);
  }
};
