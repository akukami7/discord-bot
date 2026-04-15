import mongoose from 'mongoose';

const blacklistEntrySchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, default: '' },
  // Blacklist details
  reason: { type: String },
  // Staff info
  addedBy: { type: String, required: true },
  addedByName: { type: String, default: '' },
  // Timestamps
  addedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null }, // null = permanent
  removedAt: { type: Date, default: null },
  removedBy: { type: String, default: '' },
  removedByName: { type: String, default: '' },
  // Status
  isActive: { type: Boolean, default: true },
  // Additional
  evidence: { type: String, default: '' },
  notes: { type: String, default: '' },
});

blacklistEntrySchema.index({ guildId: 1, userId: 1, isActive: 1 });
blacklistEntrySchema.index({ guildId: 1, addedAt: -1 });

export default mongoose.model('BlacklistEntry', blacklistEntrySchema);
