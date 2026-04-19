import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';
import Marriage from '../../models/Marriage.js';
import PersonalRoom from '../../models/PersonalRoom.js';
import { formatNumber, formatTime } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Топ пользователей')
    .addSubcommand(sub => sub.setName('balance').setDescription('Топ 10 по балансу'))
    .addSubcommand(sub => sub.setName('level').setDescription('Топ 10 по уровню'))
    .addSubcommand(sub => sub.setName('love').setDescription('Топ пар по парному онлайну'))
    .addSubcommand(sub => sub.setName('online').setDescription('Топ 10 по голосовому онлайну'))
    .addSubcommand(sub => sub.setName('rooms').setDescription('Топ личных комнат по онлайну')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    await interaction.deferReply();

    const ranks = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const embed = new EmbedBuilder().setColor(client.config.embedColor);
    let lines = [];
    let topDiscordId = null;

    if (sub === 'balance') {
      const users = await User.find({ guildId, balance: { $gt: 0 } }).sort({ balance: -1 }).limit(10);
      lines = users.map((u, i) => `${ranks[i]} <@${u.userId}> — **${formatNumber(u.balance)}** 🦋`);
      if (users.length > 0) topDiscordId = users[0].userId;
      embed.setTitle('Топ 10 пользователей по балансу');
    }
    else if (sub === 'level') {
      const users = await User.find({ guildId, level: { $gt: 0 } }).sort({ level: -1, totalXp: -1 }).limit(10);
      lines = users.map((u, i) => `${ranks[i]} <@${u.userId}> — **${u.level}** уровень`);
      if (users.length > 0) topDiscordId = users[0].userId;
      embed.setTitle('Топ 10 пользователей по уровню');
    }
    else if (sub === 'love') {
      const marriages = await Marriage.find({ guildId, pairOnline: { $gt: 0 } }).sort({ pairOnline: -1 }).limit(10);
      lines = marriages.map((m, i) => `${ranks[i]} <@${m.user1Id}> ❤️ <@${m.user2Id}> — **${formatTime(m.pairOnline)}**`);
      if (marriages.length > 0) topDiscordId = marriages[0].user1Id;
      embed.setTitle('Топ 10 пар по онлайну');
    }
    else if (sub === 'online') {
      const users = await User.find({ guildId, voiceOnline: { $gt: 0 } }).sort({ voiceOnline: -1 }).limit(10);
      lines = users.map((u, i) => `${ranks[i]} <@${u.userId}> — **${formatTime(u.voiceOnline)}**`);
      if (users.length > 0) topDiscordId = users[0].userId;
      embed.setTitle('Топ 10 по голосовому онлайну');
    }
    else if (sub === 'rooms') {
      const rooms = await PersonalRoom.find({ guildId, voiceOnline: { $gt: 0 } }).sort({ voiceOnline: -1 }).limit(10);
      lines = rooms.map((r, i) => `${ranks[i]} **${r.name}** (<@${r.userId}>) — **${formatTime(r.voiceOnline)}**`);
      if (rooms.length > 0) topDiscordId = rooms[0].userId;
      embed.setTitle('Топ 10 личных комнат');
    }

    embed.setDescription(lines.length ? lines.join('\n') : 'Список пока пуст.');

    if (topDiscordId) {
      try {
        const topUser = await client.users.fetch(topDiscordId);
        if (topUser) {
          embed.setThumbnail(topUser.displayAvatarURL({ size: 256 }));
        }
      } catch (_) { /* user not found */ }
    }

    return interaction.editReply({ embeds: [embed] });
  },
};
