import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  // Reporter info
  reporterId: { type: String, required: true },
  reporterName: { type: String, default: '' },
  // Reported user
  reportedId: { type: String, required: true },
  reportedName: { type: String, default: '' },
  // Report details
  reason: { type: String, required: true },
  description: { type: String, default: '' },
  // Evidence
  messageId: { type: String, default: '' },
  channelId: { type: String, default: '' },
  evidenceUrls: { type: [String], default: [] },
  // Status
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  // Review
  reviewedBy: { type: String, default: '' },
  reviewedByName: { type: String, default: '' },
  reviewNotes: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ guildId: 1, status: 1, createdAt: -1 });
reportSchema.index({ guildId: 1, reportedId: 1 });
reportSchema.index({ guildId: 1, reporterId: 1 });

export default mongoose.model('Report', reportSchema);
