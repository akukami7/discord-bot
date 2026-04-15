import mongoose from 'mongoose';

const moderatorActionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  // Action details
  type: { type: String }, // 'warn', 'mute', 'kick', 'ban', 'timeout', 'unmute', 'unban', 'note'
  targetId: { type: String, required: true },
  targetName: { type: String, default: '' },
  reason: { type: String },
  duration: { type: Number, default: 0 }, // ms for timeout/mute
  // Moderator info
  moderatorId: { type: String, required: true },
  moderatorName: { type: String, default: '' },
  // Context
  channelId: { type: String, default: '' },
  messageId: { type: String, default: '' },
  evidence: { type: String, default: '' },
  // Timestamp
  createdAt: { type: Date, default: Date.now },
  // Extra
  notes: { type: String, default: '' },
});

moderatorActionSchema.index({ guildId: 1, targetId: 1, createdAt: -1 });
moderatorActionSchema.index({ guildId: 1, moderatorId: 1, createdAt: -1 });
moderatorActionSchema.index({ guildId: 1, createdAt: -1 });

export default mongoose.model('ModeratorAction', moderatorActionSchema);
