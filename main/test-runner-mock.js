import { Client, GatewayIntentBits } from 'discord.js';
import shop from './src/commands/shop/shop.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.config = { embedAccent: '#ff0000' };

// Mock models 
import ShopItem from './src/models/ShopItem.js';
ShopItem.countDocuments = async () => 0;
ShopItem.find = () => ({ sort: () => ({ skip: () => ({ limit: async () => [] }) }) });

const interaction = {
    guild: { id: 'test_guild' },
    user: { id: 'test_user' },
    deferReply: async () => {},
    editReply: async (payload) => console.log('editReply called successfully. Components:', payload.components?.length)
};

try {
    await shop.execute(interaction, client);
    console.log('Execute completed');
} catch (e) {
    console.error('Execute error:', e.message);
}
process.exit(0);
