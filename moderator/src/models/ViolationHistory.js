import mongoose from 'mongoose';

const violationHistorySchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  // Violation details
  type: { type: String }, // 'warn', 'mute', 'kick', 'ban', 'timeout'
  reason: { type: String },
  duration: { type: Number, default: 0 }, // in ms (for timeouts/mutes)
  // Staff info
  moderatorId: { type: String, required: true },
  moderatorName: { type: String, default: '' },
  // Evidence
  messageId: { type: String, default: '' },
  channelId: { type: String, default: '' },
  evidenceUrl: { type: String, default: '' },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  // Status
  isActive: { type: Boolean, default: true },
  overturnedBy: { type: String, default: '' },
  overturnedAt: { type: Date, default: null },
});

violationHistorySchema.index({ guildId: 1, userId: 1, createdAt: -1 });
violationHistorySchema.index({ guildId: 1, moderatorId: 1, createdAt: -1 });

export default mongoose.models.ViolationHistory || mongoose.model('ViolationHistory', violationHistorySchema);
