import { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Ticket from '../models/Ticket.js';
import TicketBlacklist from '../models/TicketBlacklist.js';

export default {
    data: new SlashCommandBuilder()
        .setName('помощь')
        .setDescription('Задать вопрос по серверу')
        .addStringOption(option => 
            option.setName('вопрос')
                .setDescription('Ваш вопрос')
                .setRequired(true)
        ),
    async execute(interaction, client) {
        const guild = interaction.guild;
        const user = interaction.user;
        const question = interaction.options.getString('вопрос');

        await interaction.deferReply({ ephemeral: true });

        const isBlacklisted = await TicketBlacklist.findOne({ guildId: guild.id, userId: user.id });
        if (isBlacklisted) return interaction.editReply({ content: 'Вы находитесь в черном списке тикетов.' });

        const existingTicket = await Ticket.findOne({ guildId: guild.id, creatorId: user.id, status: { $in: ['open', 'pending'] } });
        if (existingTicket) {
            return interaction.editReply({ content: `У вас уже есть активный диалог или ваш запрос находится на рассмотрении.` });
        }

        const ticketId = `ticket-${Math.floor(Math.random() * 90000) + 10000}`;
        const categoryId = process.env.TICKETS_CATEGORY_ID;

        const userEmbed1 = new EmbedBuilder()
            .setAuthor({ name: 'Служба поддержки Angelss', iconURL: guild.iconURL() || undefined })
            .setDescription('**Ваше обращение успешно отправлено**\nОжидайте...')
            .setColor(client.config.embedColor);

        const userRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('interrupt_dialog').setLabel('Прервать диалог').setStyle(ButtonStyle.Danger)
        );

        try {
            await user.send({ embeds: [userEmbed1], components: [userRow] });
        } catch (error) {
            return interaction.editReply({ content: 'У вас закрыты личные сообщения. Вы не можете создать обращение!' });
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
                // В случае ошибки с категорией (например указан текстовый канал), создаем без нее
                delete channelOptions.parent;
                channel = await guild.channels.create(channelOptions);
            }
            const ticket = new Ticket({ ticketId, guildId: guild.id, channelId: channel.id, creatorId: user.id, status: 'pending' });
            await ticket.save();

            const staffEmbed = new EmbedBuilder()
                .setTitle('Новое обращение (Ожидает принятия)')
                .setDescription(`Пользователь ${user} (${user.id}) открыл обращение.\nНажмите "Принять", чтобы начать переписку.`)
                .addFields({ name: 'Вопрос', value: question })
                .setColor(client.config.embedColor)
                .setThumbnail(user.displayAvatarURL());

            const staffRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('accept_ticket').setLabel('Принять').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('decline_ticket').setLabel('Отклонить').setStyle(ButtonStyle.Danger)
            );

            await channel.send({ content: `@here Новое обращение от ${user.tag}`, embeds: [staffEmbed], components: [staffRow] });

            const replyEmbed = new EmbedBuilder()
                .setTitle('Задать вопрос по серверу')
                .setDescription(`${user}, Вы **успешно** задали вопрос, **ожидайте** ответа`)
                .setThumbnail(user.displayAvatarURL())
                .setColor(client.config.embedColor);

            await interaction.editReply({ embeds: [replyEmbed] });

        } catch (error) {
            console.error('Ошибка при создании тикета:', error);
            await user.send('Произошла ошибка при создании тикета (ошибка на стороне сервера). Пожалуйста, свяжитесь напрямую с администрацией.').catch(() => { });
            await interaction.editReply({ content: 'Произошла ошибка при создании тикета. Скорее всего неверный `TICKETS_CATEGORY_ID` (Должен быть ID Категории, а не текстового канала).' });
        }
    },
};
