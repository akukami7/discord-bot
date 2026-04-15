import mongoose from 'mongoose';

const nicknameHistorySchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  // Nickname info
  oldNickname: { type: String, default: '' },
  newNickname: { type: String },
  // Who changed
  changedBy: { type: String }, // 'self' or moderator id
  moderatorId: { type: String, default: '' },
  moderatorName: { type: String, default: '' },
  // Timestamp
  changedAt: { type: Date, default: Date.now },
});

nicknameHistorySchema.index({ guildId: 1, userId: 1, changedAt: -1 });
nicknameHistorySchema.index({ guildId: 1, changedAt: -1 });

export default mongoose.model('NicknameHistory', nicknameHistorySchema);
