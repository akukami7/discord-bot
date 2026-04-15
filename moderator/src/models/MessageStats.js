import mongoose from 'mongoose';

const messageStatsSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, default: '' },
  // Stats
  messagesCount: { type: Number, default: 0 },
  lastMessageAt: { type: Date, default: null },
  // Daily tracking
  dailyMessages: {
    count: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  },
  // Weekly
  weeklyMessages: { type: Number, default: 0 },
});

messageStatsSchema.index({ guildId: 1, userId: 1 }, { unique: true });
messageStatsSchema.index({ guildId: 1, messagesCount: -1 });

export default mongoose.model('MessageStats', messageStatsSchema);
