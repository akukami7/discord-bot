import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  creatorId: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed', 'pending'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  closedAt: Date,
  closedBy: String,
  transcript: String,
});

export default mongoose.model('Ticket', ticketSchema);
