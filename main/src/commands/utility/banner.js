import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Посмотреть баннер пользователя')
    .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(false)),
  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;

    await interaction.deferReply();

    // Need to force-fetch to get banner
    const fetched = await user.fetch(true);
    const banner = fetched.bannerURL({ size: 1024, dynamic: true });

    if (!banner) {
      return interaction.editReply({ content: `У ${user.displayName} нет баннера.` });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Баннер ${user.displayName}`)
      .setImage(banner)
      .setColor(client.config.embedAccent);

    await interaction.editReply({ embeds: [embed] });
  },
};
