import mongoose from 'mongoose';

const snowflakeValidator = {
  validator: v => /^\d{17,19}$/.test(v),
  message: props => `${props.value} is not a valid Discord snowflake!`,
};

const userSchema = new mongoose.Schema({
  guildId: { type: String, required: true, validate: snowflakeValidator },
  userId: { type: String, required: true, validate: snowflakeValidator },
  balance: { type: Number, default: 0, min: 0 },
}, { collection: 'mainusers' });

userSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export default mongoose.models.MainUser || mongoose.model('MainUser', userSchema);
