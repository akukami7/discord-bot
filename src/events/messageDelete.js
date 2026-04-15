import { Events } from 'discord.js';
import Ticket from '../models/Ticket.js';

export default {
    name: Events.MessageDelete,
    async execute(message, client) {
        if (!message) return;

        // Handle partial messages — fetch full data if needed
        if (message.partial) {
            try {
                message = await message.fetch();
            } catch (e) {
                // Message was deleted before we could fetch it, nothing we can do
                return;
            }
        }

        // If it's a bot message that isn't a relay embed, ignore
        if (message.author && message.author.bot && (!message.embeds || message.embeds.length === 0)) return;

        // If a message was deleted in DMs
        if (!message.guild) {
            // User deleted their message in DM
            let creatorId = message.author ? message.author.id : null;
            if (!creatorId) return; // We need creatorId to find ticket

            const ticket = await Ticket.findOne({ creatorId: creatorId, status: 'open' });
            if (!ticket) return;

            const guildId = process.env.GUILD_ID;
            if (!guildId) return;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return;

            const channel = guild.channels.cache.get(ticket.channelId);
            if (!channel) return;

            // Search recent messages in the ticket channel for the relayed embed
            try {
                const messages = await channel.messages.fetch({ limit: 50 });
                const relayedMsg = messages.find(m => 
                    m.author.id === client.user.id && 
                    m.embeds.length > 0 && 
                    m.embeds[0].footer && 
                    m.embeds[0].footer.text &&
                    m.embeds[0].footer.text.includes(message.id)
                );
                if (relayedMsg) {
                    await relayedMsg.delete().catch(() => {});
                }
            } catch(e) {
                console.error('Failed to sync deletion to channel:', e);
            }
            return;
        }

        // If a message was deleted in a guild ticket channel
        if (message.guild) {
            const ticket = await Ticket.findOne({ channelId: message.channel.id, status: 'open' });
            if (!ticket) return;

            const user = await client.users.fetch(ticket.creatorId).catch(() => null);
            if (!user) return;

            // Fetch recent messages in user's DM
            try {
                const dmChannel = await user.createDM();
                const messages = await dmChannel.messages.fetch({ limit: 50 });
                const relayedMsg = messages.find(m => 
                    m.author.id === client.user.id && 
                    m.embeds.length > 0 && 
                    m.embeds[0].footer && 
                    m.embeds[0].footer.text &&
                    m.embeds[0].footer.text.includes(message.id)
                );
                if (relayedMsg) {
                    await relayedMsg.delete().catch(() => {});
                }
            } catch(e) {
                console.error('Failed to sync deletion to DM:', e);
            }
        }
    }
};
