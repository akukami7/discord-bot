import mongoose from 'mongoose';

const voiceStateUpdateSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  // Voice session
  joinedAt: { type: Date, required: true },
  leftAt: { type: Date, default: null },
  duration: { type: Number, default: 0 }, // seconds
  // Channel info
  channelId: { type: String, default: '' },
  channelName: { type: String, default: '' },
});

voiceStateUpdateSchema.index({ guildId: 1, userId: 1, joinedAt: -1 });
voiceStateUpdateSchema.index({ guildId: 1, duration: -1 });

export default mongoose.models.VoiceStateUpdate || mongoose.model('VoiceStateUpdate', voiceStateUpdateSchema);
