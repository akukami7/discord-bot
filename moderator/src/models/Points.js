import mongoose from 'mongoose';

const pointsSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  points: { type: Number, default: 0 },
  // Points history
  earnedPoints: { type: Number, default: 0 }, // total earned
  spentPoints: { type: Number, default: 0 }, // total spent
  // History entries
  history: [{
    action: { type: String }, // 'earn', 'spend', 'convert', 'admin_add', 'admin_remove'
    amount: { type: Number },
    reason: { type: String },
    timestamp: { type: Date, default: Date.now },
    moderatorId: { type: String, default: '' },
  }],
});

pointsSchema.index({ guildId: 1, userId: 1 }, { unique: true });
pointsSchema.index({ guildId: 1, points: -1 });

export default mongoose.model('Points', pointsSchema);
