import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Посмотреть аватарку пользователя')
    .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(false)),
  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const avatar = member?.displayAvatarURL({ size: 1024, dynamic: true })
      || user.displayAvatarURL({ size: 1024, dynamic: true });

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle(`Аватар — ${user.displayName}`)
      .setImage(avatar)
      .setColor(client.config.embedColor);

    await interaction.reply({ embeds: [embed] });
  },
};
