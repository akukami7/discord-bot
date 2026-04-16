import mongoose from 'mongoose';

const snowflakeValidator = {
  validator: v => /^\d{17,19}$/.test(v),
  message: props => `${props.value} is not a valid Discord snowflake!`,
};

const duelSchema = new mongoose.Schema({
  guildId: { type: String, required: true, validate: snowflakeValidator },
  challengerId: { type: String, required: true, validate: snowflakeValidator },
  opponentId: { type: String, required: true, validate: snowflakeValidator },
  amount: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending', 'accepted', 'finished', 'expired'], default: 'pending' },
  winnerId: { type: String, default: null },
  messageId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 60000), index: true }, // 1 min
});

duelSchema.index({ guildId: 1, challengerId: 1, status: 1 });
duelSchema.index({ guildId: 1, opponentId: 1, status: 1 });

export default mongoose.model('MainDuel', duelSchema);
