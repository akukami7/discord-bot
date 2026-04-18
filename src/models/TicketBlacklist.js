import mongoose from 'mongoose';

const blacklistSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  addedBy: { type: String, required: true },
  reason: { type: String, default: 'No reason provided' },
  addedAt: { type: Date, default: Date.now },
});

// Ensure a user is only blacklisted once per guild
blacklistSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export default mongoose.models.TicketBlacklist || mongoose.model('TicketBlacklist', blacklistSchema);
