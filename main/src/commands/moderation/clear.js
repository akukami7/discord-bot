import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { createFooter } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Удалить сообщения')
    .addIntegerOption(option =>
      option.setName('count').setDescription('Количество сообщений для удаления (1-100)').setRequired(true)
    )
    .addUserOption(option =>
      option.setName('user').setDescription('Только сообщения конкретного пользователя').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const count = interaction.options.getInteger('count');
    const targetUser = interaction.options.getUser('user');

    if (count < 1 || count > 100) {
      return interaction.editReply({ content: '❌ Количество должно быть от 1 до 100.' });
    }

    try {
      const messages = await interaction.channel.messages.fetch({ limit: count });

      let filteredMessages = messages;
      if (targetUser) {
        filteredMessages = messages.filter(m => m.author.id === targetUser.id);
      }

      const deleted = await interaction.channel.bulkDelete(filteredMessages, true);

      const embed = new EmbedBuilder().setColor(0x2B2D31)
        .setColor(0x00FF00)
        .setTitle('🧹 Сообщения удалены')
        .setDescription(`Удалено **${deleted.size}** сообщений${targetUser ? ` от ${targetUser}` : ''}.`)
        .setFooter({ text: createFooter() });

      await interaction.editReply({ embeds: [embed] });

      // Delete the confirmation message after 5 seconds
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {
            // ignore cleanup error
        }
      }, 5000);

    } catch (error) {
      console.error('Clear command error:', error);
      await interaction.editReply({ content: '❌ Ошибка при удалении сообщений. Убедитесь, что сообщения не старше 14 дней.' });
    }
  },
};
