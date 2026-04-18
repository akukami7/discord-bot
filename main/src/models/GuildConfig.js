import mongoose from 'mongoose';

const snowflakeValidator = {
  validator: v => /^\d{17,19}$/.test(v),
  message: props => `${props.value} is not a valid Discord snowflake!`,
};

const guildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, validate: snowflakeValidator },
  joinLogChannel: { type: String, default: null },
  antiCrashLogChannel: { type: String, default: null },
  antiCrashEnabled: { type: Boolean, default: true },
});

export default mongoose.models.GuildConfig || mongoose.model('GuildConfig', guildConfigSchema);
