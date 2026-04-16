import { Events } from 'discord.js';
import User from '../models/User.js';
import Marriage from '../models/Marriage.js';
import PersonalRoom from '../models/PersonalRoom.js';

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState, client) {
    const userId = newState.member?.id || oldState.member?.id;
    const guildId = newState.guild?.id || oldState.guild?.id;
    if (!userId || !guildId) return;

    const leftChannel = oldState.channelId && !newState.channelId;
    const joinedChannel = !oldState.channelId && newState.channelId;
    const switchedChannel = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

    // --- User LEFT a voice channel ---
    if (leftChannel || switchedChannel) {
      await handleLeave(guildId, userId, oldState.channelId, client);
    }

    // --- User JOINED a voice channel ---
    if (joinedChannel || switchedChannel) {
      await handleJoin(guildId, userId, newState.channelId);
    }
  },
};

async function handleJoin(guildId, userId) {
  await User.findOneAndUpdate(
    { guildId, userId },
    { $set: { voiceJoinedAt: new Date() } },
    { upsert: true }
  );
}

async function handleLeave(guildId, userId, channelId, client) {
  const user = await User.findOne({ guildId, userId });
  if (!user || !user.voiceJoinedAt) return;

  const seconds = Math.floor((Date.now() - user.voiceJoinedAt.getTime()) / 1000);
  if (seconds < 1) return;

  // Check if daily reset is needed
  const today = new Date().toDateString();
  const lastReset = user.lastDailyReset ? user.lastDailyReset.toDateString() : null;
  const isNewDay = lastReset !== today;

  const updateQuery = {
    $inc: { voiceOnline: seconds, dailyVoiceOnline: isNewDay ? seconds : seconds },
    $set: { voiceJoinedAt: null }
  };

  if (isNewDay) {
    updateQuery.$set.lastDailyReset = new Date();
    updateQuery.$set.dailyVoiceOnline = seconds; // reset + add current
    delete updateQuery.$inc.dailyVoiceOnline;
  }

  await User.findOneAndUpdate({ guildId, userId }, updateQuery);

  // Update personal room voice online if this was a personal room
  await PersonalRoom.findOneAndUpdate(
    { guildId, channelId },
    { $inc: { voiceOnline: seconds } }
  );

  // Update pair online if married and partner was in same channel
  const marriage = await Marriage.findOne({
    guildId,
    $or: [{ user1Id: userId }, { user2Id: userId }]
  });

  if (marriage) {
    const partnerId = marriage.user1Id === userId ? marriage.user2Id : marriage.user1Id;

    // Check if partner is currently in the same channel
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      const channel = guild.channels.cache.get(channelId);
      if (channel && channel.members?.has(partnerId)) {
        // Partner was in the same channel, add to pair online
        await Marriage.findByIdAndUpdate(marriage._id, {
          $inc: { pairOnline: seconds }
        });
      }
    }
  }
}
