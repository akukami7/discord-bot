import mongoose from 'mongoose';

const personalRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  roleId: { type: String, required: true },
  name: { type: String, default: 'Личная роль' },
  color: { type: String, default: '#ffffff' },
  icon: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

personalRoleSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export default mongoose.model('MainPersonalRole', personalRoleSchema);
