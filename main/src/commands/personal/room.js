import { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionsBitField } from 'discord.js';
import PersonalRoom from '../../models/PersonalRoom.js';
import { formatTime } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('room')
    .setDescription('Управление личной комнатой')
    .addSubcommand(sub => sub
      .setName('info')
      .setDescription('Информация о личной комнате')
    )
    .addSubcommand(sub => sub
      .setName('manage')
      .setDescription('Управление личной комнатой')
      .addStringOption(opt => opt.setName('action').setDescription('Действие').setRequired(true)
        .addChoices(
          { name: '✏️ Переименовать', value: 'rename' },
          { name: '👥 Изменить лимит', value: 'limit' },
          { name: '🔒 Закрыть', value: 'lock' },
          { name: '🔓 Открыть', value: 'unlock' },
          { name: '🗑️ Удалить', value: 'delete' },
          { name: '➕ Создать', value: 'create' },
        ))
      .addStringOption(opt => opt.setName('value').setDescription('Значение (имя или лимит)').setRequired(false))
    ),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    if (sub === 'info') {
      const pr = await PersonalRoom.findOne({ guildId, userId });
      if (!pr) return interaction.reply({ content: 'У вас нет личной комнаты. Создайте через `/room manage action:Создать`', ephemeral: true });

      const channel = interaction.guild.channels.cache.get(pr.channelId);

      const embed = new EmbedBuilder()
        .setTitle('🏠 Личная комната')
        .addFields(
          { name: 'Название', value: pr.name, inline: true },
          { name: 'Лимит', value: pr.userLimit === 0 ? 'Без лимита' : `${pr.userLimit}`, inline: true },
          { name: 'Статус', value: pr.isLocked ? '🔒 Закрыта' : '🔓 Открыта', inline: true },
          { name: 'Голосовой онлайн', value: formatTime(pr.voiceOnline), inline: true },
          { name: 'Создана', value: `<t:${Math.floor(pr.createdAt.getTime() / 1000)}:R>`, inline: true },
        )
        .setColor(client.config.embedAccent);

      if (!channel) embed.setFooter({ text: '⚠️ Канал был удалён на сервере' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'manage') {
      await interaction.deferReply({ ephemeral: true });
      const action = interaction.options.getString('action');
      const value = interaction.options.getString('value');

      if (action === 'create') {
        const existing = await PersonalRoom.findOne({ guildId, userId });
        if (existing) return interaction.editReply('❌ У вас уже есть личная комната!');

        const name = value || `${interaction.user.displayName}'s Room`;

        try {
          const channel = await interaction.guild.channels.create({
            name,
            type: ChannelType.GuildVoice,
            permissionOverwrites: [
              {
                id: userId,
                allow: [
                  PermissionsBitField.Flags.ManageChannels,
                  PermissionsBitField.Flags.Connect,
                  PermissionsBitField.Flags.MuteMembers,
                  PermissionsBitField.Flags.DeafenMembers,
                  PermissionsBitField.Flags.MoveMembers,
                ],
              },
            ],
          });

          await PersonalRoom.create({ guildId, userId, channelId: channel.id, name });

          return interaction.editReply(`✅ Личная комната **${name}** создана!`);
        } catch (err) {
          console.error('Room create error:', err);
          return interaction.editReply('❌ Ошибка при создании комнаты.');
        }
      }

      const pr = await PersonalRoom.findOne({ guildId, userId });
      if (!pr) return interaction.editReply('❌ У вас нет личной комнаты!');

      const channel = interaction.guild.channels.cache.get(pr.channelId);

      if (action === 'delete') {
        if (channel) await channel.delete().catch(() => {});
        await PersonalRoom.findByIdAndDelete(pr._id);
        return interaction.editReply('✅ Личная комната удалена.');
      }

      if (!channel) return interaction.editReply('❌ Канал не найден. Удалите комнату и создайте заново.');

      if (action === 'rename') {
        if (!value) return interaction.editReply('❌ Укажите новое имя в параметре `value`!');
        await channel.setName(value).catch(() => {});
        pr.name = value;
        await pr.save();
        return interaction.editReply(`✅ Комната переименована в **${value}**`);
      }

      if (action === 'limit') {
        const limit = parseInt(value) || 0;
        await channel.setUserLimit(limit).catch(() => {});
        pr.userLimit = limit;
        await pr.save();
        return interaction.editReply(`✅ Лимит установлен: **${limit === 0 ? 'Без лимита' : limit}**`);
      }

      if (action === 'lock') {
        await channel.permissionOverwrites.edit(guildId, { Connect: false }).catch(() => {});
        pr.isLocked = true;
        await pr.save();
        return interaction.editReply('🔒 Комната закрыта.');
      }

      if (action === 'unlock') {
        await channel.permissionOverwrites.edit(guildId, { Connect: null }).catch(() => {});
        pr.isLocked = false;
        await pr.save();
        return interaction.editReply('🔓 Комната открыта.');
      }
    }
  },
};
