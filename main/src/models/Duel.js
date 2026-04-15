import mongoose from 'mongoose';

const duelSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  challengerId: { type: String, required: true },
  opponentId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'finished', 'expired'], default: 'pending' },
  winnerId: { type: String, default: null },
  messageId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 60000) }, // 1 min
});

duelSchema.index({ guildId: 1, challengerId: 1, status: 1 });
duelSchema.index({ guildId: 1, opponentId: 1, status: 1 });

export default mongoose.model('MainDuel', duelSchema);
