import { Events } from 'discord.js';
import User from '../models/User.js';
import { xpForLevel, randomInt } from '../../../shared/utils/helpers.js';

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    // Track message count regardless of XP cooldown
    const userMsg = await User.findOneAndUpdate(
      { guildId, userId },
      { $inc: { messages: 1 } },
      { upsert: true, new: true }
    );

    // XP Cooldown check using CooldownManager
    const cooldownKey = `${guildId}-${userId}`;
    if (client.xpCooldowns.isOnCooldown(cooldownKey, client.config.xpCooldown)) return;

    const xpGain = randomInt(client.config.xpMin, client.config.xpMax);

    userMsg.xp += xpGain;
    userMsg.totalXp += xpGain;
    
    // Check level up
    const xpNeeded = xpForLevel(userMsg.level);
    if (userMsg.xp >= xpNeeded) {
      userMsg.xp -= xpNeeded;
      userMsg.level += 1;
      
      // Level up notification
      message.channel.send({
        content: `🎉 ${message.author} достиг **${userMsg.level}** уровня!`
      }).catch(() => {});
    }
    
    await userMsg.save();
  },
};
