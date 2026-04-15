import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  fromId: { type: String, required: true },
  toId: { type: String, default: null },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['give', 'shop', 'coinflip', 'duel', 'timely', 'convert', 'reward', 'role', 'room'], required: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

transactionSchema.index({ guildId: 1, fromId: 1, createdAt: -1 });
transactionSchema.index({ guildId: 1, toId: 1, createdAt: -1 });

export default mongoose.model('MainTransaction', transactionSchema);
