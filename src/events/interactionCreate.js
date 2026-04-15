import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ChannelType, PermissionsBitField } from 'discord.js';
import Ticket from '../models/Ticket.js';
import TicketBlacklist from '../models/TicketBlacklist.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}`, error);
        const replyPayload = { content: 'There was an error while executing this command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyPayload).catch(e => console.error('FollowUp Error:', e.message));
        } else {
          await interaction.reply(replyPayload).catch(e => console.error('Reply Error:', e.message));
        }
      }
    } else if (interaction.isButton()) {

      // User clicked "Create Ticket" button from the setup panel
      if (interaction.customId === 'create_ticket_btn') {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const user = interaction.user;

        const isBlacklisted = await TicketBlacklist.findOne({ guildId: guild.id, userId: user.id });
        if (isBlacklisted) return interaction.editReply({ content: 'Вы находитесь в черном списке тикетов.' });

        const existingTicket = await Ticket.findOne({ guildId: guild.id, creatorId: user.id, status: { $in: ['open', 'pending'] } });
        if (existingTicket) {
          return interaction.editReply({ content: 'У вас уже есть активный диалог или ваш запрос находится на рассмотрении.' });
        }

        const ticketId = `ticket-${Math.floor(Math.random() * 90000) + 10000}`;
        const categoryId = process.env.TICKETS_CATEGORY_ID;

        const userEmbed1 = new EmbedBuilder()
          .setAuthor({ name: 'Служба поддержки Angelss', iconURL: guild.iconURL() || undefined })
          .setDescription('**Ваше обращение успешно отправлено**\nОжидайте...\n\nНапишите ваш вопрос прямо сюда в ЛС.')
          .setColor(client.config.embedColor);

        const userRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('interrupt_dialog').setLabel('Прервать диалог').setStyle(ButtonStyle.Danger)
        );

        try {
          await user.send({ embeds: [userEmbed1], components: [userRow] });
        } catch (error) {
          return interaction.editReply({ content: 'У вас закрыты личные сообщения. Откройте ЛС и попробуйте снова!' });
        }

        try {
          const channelOptions = {
            name: `${user.username}-${ticketId}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
              { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
            ],
          };

          let channel;
          try {
            if (categoryId) channelOptions.parent = categoryId;
            channel = await guild.channels.create(channelOptions);
          } catch (categoryError) {
            delete channelOptions.parent;
            channel = await guild.channels.create(channelOptions);
          }

          const ticket = new Ticket({ ticketId, guildId: guild.id, channelId: channel.id, creatorId: user.id, status: 'pending' });
          await ticket.save();

          const staffEmbed = new EmbedBuilder()
            .setTitle('Новое обращение (Ожидает принятия)')
            .setDescription(`Пользователь ${user} (${user.id}) открыл обращение через панель.`)
            .setColor(client.config.embedColor)
            .setThumbnail(user.displayAvatarURL());

          const staffRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('accept_ticket').setLabel('Принять').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('decline_ticket').setLabel('Отклонить').setStyle(ButtonStyle.Danger)
          );

          await channel.send({ content: `@here Новое обращение от ${user.tag}`, embeds: [staffEmbed], components: [staffRow] });

          await interaction.editReply({ content: '✅ Ваше обращение успешно создано! Проверьте личные сообщения.' });
        } catch (error) {
          console.error('Ошибка при создании тикета через панель:', error);
          await user.send('Произошла ошибка при создании тикета. Пожалуйста, свяжитесь напрямую с администрацией.').catch(() => {});
          await interaction.editReply({ content: 'Произошла ошибка при создании тикета.' });
        }
      }

      // User clicked "Interrupt Dialog" in DM
      if (interaction.customId === 'interrupt_dialog') {
        const embed = new EmbedBuilder()
          .setTitle('Прервать диалог')
          .setDescription(`${interaction.user}, Вы уверены, что хотите прервать диалог? Если Вы будете прерывать диалог без веской причины, то можете получить блокировку в нашей службе поддержки\nДля согласия нажмите на ✅, для отказа на ❌`)
          .setColor(client.config.embedColor);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('confirm_interrupt').setEmoji('✅').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('cancel_interrupt').setEmoji('❌').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row] }).catch(() => {});
      }

      // Cancel interruption
      if (interaction.customId === 'cancel_interrupt') {
        await interaction.message.delete().catch(() => { });
      }

      // Confirm interruption (User closes ticket from DM)
      if (interaction.customId === 'confirm_interrupt') {
        await interaction.deferUpdate().catch(() => {});
        await interaction.message.delete().catch(() => { });

        // Find ticket from DB where creatorId matches
        const ticket = await Ticket.findOne({ creatorId: interaction.user.id, status: 'open' });
        if (!ticket) return interaction.followUp({ content: 'У вас нет активных диалогов.', ephemeral: true }).catch(() => {});

        await closeTicket(interaction, client, ticket, interaction.user.id, true);
      }

      // Admin accepts ticket from Channel
      if (interaction.customId === 'accept_ticket') {
        await interaction.deferUpdate().catch(() => {});
        const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: 'pending' });
        if (!ticket) return interaction.followUp({ content: 'Этот тикет уже обработан или не существует.', ephemeral: true }).catch(() => {});

        ticket.status = 'open';
        await ticket.save();

        const staffRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Закрыть тикет').setStyle(ButtonStyle.Danger)
        );
        const embed = interaction.message.embeds[0];
        const newEmbed = EmbedBuilder.from(embed).setTitle('Новое обращение (В диалоге)').setDescription('Диалог начат. Отвечайте на его сообщения прямо в этом канале.');
        await interaction.message.edit({ embeds: [newEmbed], components: [staffRow] }).catch(() => {});

        const user = await client.users.fetch(ticket.creatorId).catch(() => null);
        if (user) {
            const guild = client.guilds.cache.get(ticket.guildId);
            const userEmbed2 = new EmbedBuilder()
                .setAuthor({ name: 'Служба поддержки Angelss', iconURL: guild ? guild.iconURL() : undefined })
                .setDescription('**Пиши сообщения прямо сюда**\nСпасибо за обращение в нашу службу поддержки.\nСейчас постараемся решить твой вопрос, оставайся на связи.')
                .setColor(client.config.embedColor);
            await user.send({ embeds: [userEmbed2] }).catch(() => {});
        }
      }

      // Admin declines ticket from Channel
      if (interaction.customId === 'decline_ticket') {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
        const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: 'pending' });
        if (!ticket) return interaction.editReply('Этот тикет уже обработан или не существует.').catch(() => {});

        await closeTicket(interaction, client, ticket, interaction.user.id, false, true);
      }

      // Admin closes ticket from Channel
      if (interaction.customId === 'close_ticket') {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
        const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: 'open' });
        if (!ticket) return interaction.editReply('Это не активный тикет!').catch(() => {});

        await closeTicket(interaction, client, ticket, interaction.user.id, false);
      }
    }
  },
};

async function closeTicket(interaction, client, ticket, closerId, isClosedByUser, isDeclined = false) {
  // Generate Transcript
  let guild, channel;

  // We get guild using ticket's guildId
  guild = client.guilds.cache.get(ticket.guildId);
  if (guild) channel = guild.channels.cache.get(ticket.channelId);

  let transcriptText = "Transcript could not be generated.";
  if (channel) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      transcriptText = messages.reverse().map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}`).join('\n');

      const closeMessage = isClosedByUser
        ? 'Диалог прерван пользователем. Канал будет удален через 5 секунд...'
        : isDeclined
          ? 'Обращение отклонено. Канал будет удален через 5 секунд...'
          : 'Диалог закрыт администратором. Канал будет удален через 5 секунд...';

      await channel.send(closeMessage).catch(() => { });
      setTimeout(async () => {
        await channel.delete().catch(() => { });
      }, 5000);
    } catch (e) {
      console.error(e);
    }
  }

  const transcriptBuffer = Buffer.from(transcriptText, 'utf-8');
  const attachment = new AttachmentBuilder(transcriptBuffer, { name: `${ticket.ticketId}-transcript.txt` });

  ticket.status = 'closed';
  ticket.closedAt = new Date();
  ticket.closedBy = closerId;
  ticket.transcript = transcriptText;
  await ticket.save();

  // Send the user the final message
  const user = await client.users.fetch(ticket.creatorId).catch(() => null);
  if (user) {
    const userEmbed = new EmbedBuilder()
      .setAuthor({ name: 'Служба поддержки Angelss', iconURL: guild ? guild.iconURL() : undefined })
      .setDescription(isDeclined ? '**Ваше обращение было отклонено**' : '**Диалог завершен**')
      .setColor(client.config.embedColor);
    await user.send({ embeds: [userEmbed] }).catch(() => { });
  }

  // Log the closed ticket
  const logChannelId = process.env.TICKETS_LOG_CHANNEL_ID;
  if (guild && logChannelId) {
    const logChannel = guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🔒 Тикет закрыт (Modmail)')
        .addFields(
          { name: 'ID Тикета', value: ticket.ticketId, inline: true },
          { name: 'Создатель', value: `<@${ticket.creatorId}>`, inline: true },
          { name: 'Закрыл', value: isClosedByUser ? `<@${closerId}> (Пользователь)` : `<@${closerId}> (Админ)`, inline: true }
        )
        .setColor(0xED4245)
        .setTimestamp();

      try {
        await logChannel.send({ embeds: [logEmbed], files: [attachment] });
      } catch (e) {
        console.error('Failed to send transcript', e);
      }
    }
  }

  if (!isClosedByUser && (interaction.replied || interaction.deferred)) {
    await interaction.editReply('Тикет будет удален через 5 секунд...').catch(() => {});
  }
}
