import mongoose from 'mongoose';

const snowflakeValidator = {
  validator: v => /^\d{17,19}$/.test(v),
  message: props => `${props.value} is not a valid Discord snowflake!`,
};

const userSchema = new mongoose.Schema({
  guildId: { type: String, required: true, validate: snowflakeValidator },
  userId: { type: String, required: true, validate: snowflakeValidator },
  // Economy
  balance: { type: Number, default: 0, min: 0 },
  stars: { type: Number, default: 0, min: 0 },
  messages: { type: Number, default: 0, min: 0 },
  // Leveling
  level: { type: Number, default: 0, min: 0 },
  xp: { type: Number, default: 0, min: 0 },
  totalXp: { type: Number, default: 0, min: 0 },
  // Voice
  voiceOnline: { type: Number, default: 0, min: 0 },       // total seconds
  dailyVoiceOnline: { type: Number, default: 0, min: 0 },  // daily seconds
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

export default mongoose.models.MainUser || mongoose.model('MainUser', userSchema);
