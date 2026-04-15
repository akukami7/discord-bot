import { Client, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';
import shop from './src/commands/shop/shop.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.config = { embedAccent: '#ff0000' };

mongoose.connect('mongodb://127.0.0.1/main').then(async () => {
    const interaction = {
        guild: { id: 'test_guild' },
        user: { id: 'test_user' },
        deferReply: async () => console.log('deferReply called'),
        editReply: async (payload) => console.log('editReply called successfully. Components:', payload.components?.length)
    };
    
    try {
        await shop.execute(interaction, client);
        console.log('Execute completed');
    } catch (e) {
        console.error('Execute error:', e);
    }
    process.exit(0);
});
