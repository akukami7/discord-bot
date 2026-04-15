import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  // Economy
  balance: { type: Number, default: 0 },
  stars: { type: Number, default: 0 },
  // Leveling
  level: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  totalXp: { type: Number, default: 0 },
  // Voice
  voiceOnline: { type: Number, default: 0 },       // total seconds
  dailyVoiceOnline: { type: Number, default: 0 },  // daily seconds
  lastDailyReset: { type: Date, default: null },    // last daily reset date
  voiceJoinedAt: { type: Date, default: null },     // when joined voice
  // Timely
  lastTimely: { type: Date, default: null },
  // Profile
  bio: { type: String, default: '' },
  profileColor: { type: String, default: '#2f3136' },
});

userSchema.index({ guildId: 1, userId: 1 }, { unique: true });
userSchema.index({ guildId: 1, balance: -1 });
userSchema.index({ guildId: 1, level: -1, totalXp: -1 });
userSchema.index({ guildId: 1, voiceOnline: -1 });

export default mongoose.model('MainUser', userSchema);
