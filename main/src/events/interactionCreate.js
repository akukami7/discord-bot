import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing /${interaction.commandName}:`, error);
        const payload = { content: '❌ Произошла ошибка при выполнении команды.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
    } else if (interaction.isButton()) {
      // Check customId prefixes and delegate to command handlers
      if (interaction.customId.startsWith('duel_')) {
        const duelCmd = client.commands.get('duel');
        if (duelCmd && duelCmd.handleButton) {
          try {
            await duelCmd.handleButton(interaction, client);
          } catch (e) {
            console.error('Duel button error:', e);
          }
        }
      } else if (interaction.customId.startsWith('marry_')) {
        const marryCmd = client.commands.get('marry');
        if (marryCmd && marryCmd.handleButton) {
          try {
            await marryCmd.handleButton(interaction, client);
          } catch (e) {
            console.error('Marry button error:', e);
          }
        }
      } else if (interaction.customId.startsWith('shop_')) {
        const shopCmd = client.commands.get('shop');
        if (shopCmd && shopCmd.handleButton) {
          try {
            await shopCmd.handleButton(interaction, client);
          } catch (e) {
            console.error('Shop button error:', e);
          }
        }
      } else if (interaction.customId.startsWith('tx_')) {
        const txCmd = client.commands.get('transaction');
        if (txCmd && txCmd.handleButton) {
          try {
            await txCmd.handleButton(interaction, client);
          } catch (e) {
            console.error('Transaction button error:', e);
          }
        }
      } else if (interaction.customId.startsWith('inv_')) {
        const invCmd = client.commands.get('inventory');
        if (invCmd && invCmd.handleButton) {
          try {
            await invCmd.handleButton(interaction, client);
          } catch (e) {
            console.error('Inventory button error:', e);
          }
        }
      } else if (interaction.customId.startsWith('coinflip_')) {
        const cfCmd = client.commands.get('coinflip');
        if (cfCmd && cfCmd.handleButton) {
          try {
            await cfCmd.handleButton(interaction, client);
          } catch (e) {
            console.error('Coinflip button error:', e);
          }
        }
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('shop_')) {
        const shopCmd = client.commands.get('shop');
        if (shopCmd && shopCmd.handleSelectMenu) {
          try {
            await shopCmd.handleSelectMenu(interaction, client);
          } catch (e) {
            console.error('Shop select menu error:', e);
          }
        }
      }
    }
  },
};
