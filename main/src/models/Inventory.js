import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MainShopItem', required: true },
  acquiredAt: { type: Date, default: Date.now },
  uses: { type: Number, default: -1 }, // -1 = unlimited
});

inventorySchema.index({ guildId: 1, userId: 1 });

export default mongoose.models.MainInventory || mongoose.model('MainInventory', inventorySchema);
