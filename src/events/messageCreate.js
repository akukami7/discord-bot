import { Events, EmbedBuilder } from 'discord.js';
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
                // Ignore DMs if no ticket exists, or tell them to use the command
                return message.reply('У вас нет активного диалога. Используйте команду `/помощь` на сервере для создания обращения.');
            }

            const channel = guild.channels.cache.get(ticket.channelId);
            if (channel) {
                const relayEmbed = new EmbedBuilder().setColor(0x2B2D31)
                    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                    .setDescription(message.content || '*Без текста*')
                    .setColor('#2b2d31')
                    .setFooter({ text: `Message ID: ${message.id}` });

                const files = message.attachments.map(a => a.url);
                try {
                    await channel.send({ embeds: [relayEmbed], files });
                } catch (e) {
                    console.error(e);
                }
            }
            return;
        }

        // --- Handling guild messages (Admin to User) ---
        if (message.guild) {
            const ticket = await Ticket.findOne({ channelId: message.channel.id, status: 'open' });
            if (!ticket) return;

            const user = await client.users.fetch(ticket.creatorId).catch(() => null);
            if (!user) return message.reply('Пользователь не найден (возможно покинул сервер или заблокировал бота).');

            const relayEmbed = new EmbedBuilder().setColor(0x2B2D31)
                .setAuthor({ name: 'Служба поддержки Angelss', iconURL: message.guild.iconURL() })
                .setDescription(message.content || '*Без текста*')
                .setColor(client.config.embedColor)
                .setFooter({ text: `Message ID: ${message.id}` });

            const files = message.attachments.map(a => a.url);

            try {
                await user.send({ embeds: [relayEmbed], files });
            } catch (err) {
                console.error(err);
                message.reply('Не удалось доставить сообщение пользователю (ЛС закрыты).');
            }
        }
    }
};
