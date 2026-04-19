import mongoose from 'mongoose';

const shopItemSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  currency: { type: String, enum: ['coins', 'stars', 'standart'], default: 'coins' },
  type: { type: String, enum: ['role', 'reaction', 'room', 'profile', 'other'], default: 'other' },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  creatorId: { type: String, default: null },
  purchases: { type: Number, default: 0 },
  duration: { type: Number, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

shopItemSchema.index({ guildId: 1, isActive: 1 });

export default mongoose.models.MainShopItem || mongoose.model('MainShopItem', shopItemSchema);
