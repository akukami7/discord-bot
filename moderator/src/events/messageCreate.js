import { Events, EmbedBuilder } from 'discord.js';
import MessageStats from '../models/MessageStats.js';
import NicknameHistory from '../models/NicknameHistory.js';

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;
    const username = message.author.username;

    // Track message stats for staff
    await MessageStats.findOneAndUpdate(
      { guildId, userId },
      {
        $inc: { messagesCount: 1 },
        $set: {
          username,
          lastMessageAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  },
};
