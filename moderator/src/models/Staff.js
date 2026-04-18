import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, default: '' },
  // Staff info
  rank: { type: String, default: 'Младший модератор' }, // rank/title
  rankLevel: { type: Number, default: 1 }, // numeric rank level
  points: { type: Number, default: 0 },
  // Activity stats
  actionsCount: { type: Number, default: 0 }, // total moderation actions
  messagesCount: { type: Number, default: 0 }, // text activity
  voiceOnline: { type: Number, default: 0 }, // seconds in voice
  verificationsCount: { type: Number, default: 0 },
  recruitmentsCount: { type: Number, default: 0 },
  avgRecruitmentResponseTime: { type: Number, default: 0 }, // in ms
  // Status
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  hiredAt: { type: Date, default: Date.now },
  lastActionAt: { type: Date, default: null },
  // Blacklist
  isBlacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String, default: '' },
  blacklistedAt: { type: Date, default: null },
  blacklistedBy: { type: String, default: '' },
});

staffSchema.index({ guildId: 1, userId: 1 }, { unique: true });
staffSchema.index({ guildId: 1, points: -1 });
staffSchema.index({ guildId: 1, actionsCount: -1 });
staffSchema.index({ guildId: 1, messagesCount: -1 });
staffSchema.index({ guildId: 1, voiceOnline: -1 });

export default mongoose.models.Staff || mongoose.model('Staff', staffSchema);
