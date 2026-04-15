import { Events } from 'discord.js';
import User from '../models/User.js';
import { xpForLevel, randomInt } from '../utils/helpers.js';

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    // XP Cooldown check
    const cooldownKey = `${guildId}-${userId}`;
    const lastXp = client.xpCooldowns.get(cooldownKey);
    if (lastXp && Date.now() - lastXp < client.config.xpCooldown) return;

    client.xpCooldowns.set(cooldownKey, Date.now());

    const xpGain = randomInt(client.config.xpMin, client.config.xpMax);

    let user = await User.findOneAndUpdate(
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

      // Level up notification (optional — send in same channel)
      message.channel.send({
        content: `🎉 ${message.author} достиг **${user.level}** уровня!`
      }).catch(() => {});
    }
  },
};
