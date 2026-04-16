import mongoose from 'mongoose';

const snowflakeValidator = {
  validator: v => /^\d{17,19}$/.test(v),
  message: props => `${props.value} is not a valid Discord snowflake!`,
};

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true, validate: snowflakeValidator },
  channelId: { type: String, required: true, validate: snowflakeValidator },
  creatorId: { type: String, required: true, validate: snowflakeValidator },
  status: { type: String, enum: ['open', 'closed', 'pending'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  closedAt: Date,
  closedBy: String,
  transcript: String,
});

ticketSchema.index({ guildId: 1, creatorId: 1, status: 1 });

export default mongoose.model('Ticket', ticketSchema);
