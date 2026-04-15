import mongoose from 'mongoose';

const personalRoomSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  channelId: { type: String, required: true },
  name: { type: String, default: 'Личная комната' },
  userLimit: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  voiceOnline: { type: Number, default: 0 }, // total seconds in this room
  createdAt: { type: Date, default: Date.now },
});

personalRoomSchema.index({ guildId: 1, userId: 1 }, { unique: true });
personalRoomSchema.index({ guildId: 1, voiceOnline: -1 });

export default mongoose.model('MainPersonalRoom', personalRoomSchema);
