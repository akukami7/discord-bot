import { Events } from 'discord.js';
import User from '../models/User.js';
import { xpForLevel, randomInt } from '../../../shared/utils/helpers.js';

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    // XP Cooldown check using CooldownManager
    const cooldownKey = `${guildId}-${userId}`;
    if (client.xpCooldowns.isOnCooldown(cooldownKey, client.config.xpCooldown)) return;

    const xpGain = randomInt(client.config.xpMin, client.config.xpMax);

    const user = await User.findOneAndUpdate(
      { guildId, userId },
      { $inc: { xp: xpGain, totalXp: xpGain } },
      { upsert: true, new: true }
    );

    // Check level up
    const xpNeeded = xpForLevel(user.level);
    if (user.xp >= xpNeeded) {
      user.xp -= xpNeeded;
      user.level += 1;
      await user.save();

      // Level up notification
      message.channel.send({
        content: `🎉 ${message.author} достиг **${user.level}** уровня!`
      }).catch(() => {});
    }
  },
};
