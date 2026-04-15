import { Events } from 'discord.js';

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState, client) {
    // User joined a voice channel
    if (!oldState.channelId && newState.channelId && newState.member) {
      client.voiceJoinTimes.set(newState.userId, Date.now());
    }

    // User left a voice channel
    if (oldState.channelId && !newState.channelId) {
      const joinTime = client.voiceJoinTimes.get(oldState.userId);
      if (joinTime) {
        const duration = Math.floor((Date.now() - joinTime) / 1000); // seconds
        client.voiceJoinTimes.delete(oldState.userId);

        // Update staff voice time
        const Staff = (await import('../models/Staff.js')).default;
        await Staff.findOneAndUpdate(
          { guildId: oldState.guild.id, userId: oldState.userId },
          { $inc: { voiceOnline: duration } }
        );
      }
    }
  },
};
