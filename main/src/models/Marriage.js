import mongoose from 'mongoose';

const marriageSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  user1Id: { type: String, required: true },
  user2Id: { type: String, required: true },
  marriedAt: { type: Date, default: Date.now },
  pairOnline: { type: Number, default: 0 }, // seconds together in voice
});

// Unique indexes to prevent double-marriage (race condition protection)
marriageSchema.index({ guildId: 1, user1Id: 1 }, { unique: true });
marriageSchema.index({ guildId: 1, user2Id: 1 }, { unique: true });
marriageSchema.index({ guildId: 1, pairOnline: -1 });

export default mongoose.model('MainMarriage', marriageSchema);
