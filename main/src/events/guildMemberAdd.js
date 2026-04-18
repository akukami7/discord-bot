import { EmbedBuilder } from 'discord.js';
import GuildConfig from '../models/GuildConfig.js';

export default {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guildId = member.guild.id;

    try {
      const config = await GuildConfig.findOne({ guildId });
      if (!config || !config.joinLogChannel) return;

      const channel = member.guild.channels.cache.get(config.joinLogChannel);
      if (!channel) return;

      const embed = new EmbedBuilder().setColor(0x2B2D31)
        .setColor(client.config.embedColor)
        .setTitle('👋 Новый участник!')
        .setThumbnail(member.user.displayAvatarURL({ size: 1024, dynamic: true }))
        .setDescription(`<@${member.id}> присоединился к серверу!`)
        .addFields(
          { name: 'Пользователь', value: `${member.user.tag}`, inline: true },
          { name: 'ID', value: `\`${member.id}\``, inline: true },
          { name: 'Участников теперь', value: `**${member.guild.memberCount}**`, inline: true }
        )
        .setFooter({ text: 'Аккаунт создан' })
        .setTimestamp(member.user.createdAt);

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error in guildMemberAdd:', error);
    }
  },
};
