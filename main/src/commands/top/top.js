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

    if (sub === 'balance') {
      const users = await User.find({ guildId, balance: { $gt: 0 } })
        .sort({ balance: -1 })
        .limit(10);

      const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

      const lines = users.map((u, i) => {
        return `${numberEmojis[i]} <@${u.userId}> — **${formatNumber(u.balance)}**`;
      });

      const embed = new EmbedBuilder()
        .setTitle('Топ 10 пользователей по балансу')
        .setDescription(lines.length ? lines.join('\n') : 'Нет данных.');

      // Set first user's avatar as thumbnail
      if (users.length > 0) {
        try {
          const firstUser = await client.users.fetch(users[0].userId);
          embed.setThumbnail(firstUser.displayAvatarURL({ size: 256 }));
        } catch (err) {
          // ignore fetch errors
        }
      }

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'level') {
      const users = await User.find({ guildId, level: { $gt: 0 } })
        .sort({ level: -1, totalXp: -1 })
        .limit(10);

      const lines = users.map((u, i) => {
        const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `\`${i + 1}.\``;
        return `${medal} <@${u.userId}> — **${u.level}** уровень (${formatNumber(u.totalXp)} XP)`;
      });

      const embed = new EmbedBuilder()
        .setTitle('📊 Топ по уровню')
        .setDescription(lines.length ? lines.join('\n') : 'Нет данных.')
        .setColor(client.config.embedAccent);

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'love') {
      const marriages = await Marriage.find({ guildId, pairOnline: { $gt: 0 } })
        .sort({ pairOnline: -1 })
        .limit(10);

      const lines = marriages.map((m, i) => {
        const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `\`${i + 1}.\``;
        return `${medal} <@${m.user1Id}> ❤️ <@${m.user2Id}> — **${formatTime(m.pairOnline)}**`;
      });

      const embed = new EmbedBuilder()
        .setTitle('❤️ Топ пар по онлайну')
        .setDescription(lines.length ? lines.join('\n') : 'Нет данных.')
        .setColor(0xEB459E);

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'online') {
      const users = await User.find({ guildId, voiceOnline: { $gt: 0 } })
        .sort({ voiceOnline: -1 })
        .limit(10);

      const lines = users.map((u, i) => {
        const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `\`${i + 1}.\``;
        return `${medal} <@${u.userId}> — **${formatTime(u.voiceOnline)}**`;
      });

      const embed = new EmbedBuilder()
        .setTitle('🎙️ Топ по голосовому онлайну')
        .setDescription(lines.length ? lines.join('\n') : 'Нет данных.')
        .setColor(client.config.embedAccent);

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'rooms') {
      const rooms = await PersonalRoom.find({ guildId, voiceOnline: { $gt: 0 } })
        .sort({ voiceOnline: -1 })
        .limit(10);

      const lines = rooms.map((r, i) => {
        const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `\`${i + 1}.\``;
        return `${medal} **${r.name}** (<@${r.userId}>) — **${formatTime(r.voiceOnline)}**`;
      });

      const embed = new EmbedBuilder()
        .setTitle('🏠 Топ личных комнат')
        .setDescription(lines.length ? lines.join('\n') : 'Нет данных.')
        .setColor(client.config.embedAccent);

      return interaction.editReply({ embeds: [embed] });
    }
  },
};
