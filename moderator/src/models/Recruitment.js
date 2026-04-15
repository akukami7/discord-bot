import mongoose from 'mongoose';

const recruitmentSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  // Applicant info
  applicantId: { type: String, required: true },
  applicantName: { type: String, default: '' },
  // Staff who responded
  responderId: { type: String, default: '' },
  responderName: { type: String, default: '' },
  // Timing
  applicationPostedAt: { type: Date, required: true },
  firstResponseAt: { type: Date, default: null },
  responseTime: { type: Number, default: 0 }, // ms between posted and first response
  // Status
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' },
  // Decision
  decidedBy: { type: String, default: '' },
  decidedByName: { type: String, default: '' },
  decisionReason: { type: String, default: '' },
  decidedAt: { type: Date, default: null },
  // Created at
  createdAt: { type: Date, default: Date.now },
});

recruitmentSchema.index({ guildId: 1, status: 1, createdAt: -1 });
recruitmentSchema.index({ guildId: 1, responderId: 1 });

export default mongoose.model('Recruitment', recruitmentSchema);
