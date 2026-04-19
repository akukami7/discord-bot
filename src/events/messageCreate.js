import { Events, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import Ticket from '../models/Ticket.js';
import TicketBlacklist from '../models/TicketBlacklist.js';

export default {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        // --- Handling DM from User to Bot ---
        if (!message.guild) {
            const guildId = process.env.GUILD_ID;
            if (!guildId) return;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) return;

            const user = message.author;
            const isBlacklisted = await TicketBlacklist.findOne({ guildId, userId: user.id });
            if (isBlacklisted) return;

            const pendingTicket = await Ticket.findOne({ guildId, creatorId: user.id, status: 'pending' });
            if (pendingTicket) {
                return message.reply('Ваше обращение еще на рассмотрении у администрации. Пожалуйста, дождитесь принятия запроса.');
            }

            const ticket = await Ticket.findOne({ guildId, creatorId: user.id, status: 'open' });

            if (!ticket) {
                return message.reply('У вас нет активного диалога. Используйте команду `/помощь` на сервере для создания обращения.');
            }

            const channel = guild.channels.cache.get(ticket.channelId);
            if (channel) {
                const relayEmbed = new EmbedBuilder()
                    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                    .setDescription(message.content || '*Без текста*')
                    .setColor(client.config.embedColor)
                    .setFooter({ text: `Message ID: ${message.id}` });

                const files = [];
                for (const a of message.attachments.values()) {
                    try {
                        const res = await fetch(a.url);
                        const buf = Buffer.from(await res.arrayBuffer());
                        files.push(new AttachmentBuilder(buf, { name: a.name }));
                    } catch (_) { /* attachment download failed */ }
                }

                try {
                    await channel.send({ embeds: [relayEmbed], files });
                } catch (e) {
                    console.error(e);
                }
            }
            return;
        }

        // --- Handling guild messages (Admin to User) ---
        const ticket = await Ticket.findOne({ channelId: message.channel.id, status: 'open' });
        if (!ticket) return;

        const user = await client.users.fetch(ticket.creatorId).catch(() => null);
        if (!user) return message.reply('Пользователь не найден (возможно покинул сервер или заблокировал бота).');

        const relayEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Служба поддержки Angelss', iconURL: message.guild.iconURL() })
            .setDescription(message.content || '*Без текста*')
            .setColor(client.config.embedColor)
            .setFooter({ text: `Message ID: ${message.id}` });

        const files = [];
        for (const a of message.attachments.values()) {
            try {
                const res = await fetch(a.url);
                const buf = Buffer.from(await res.arrayBuffer());
                files.push(new AttachmentBuilder(buf, { name: a.name }));
            } catch (_) { /* attachment download failed */ }
        }

        try {
            await user.send({ embeds: [relayEmbed], files });
        } catch (err) {
            console.error(err);
            message.reply('Не удалось доставить сообщение пользователю (ЛС закрыты).');
        }
    }
};
