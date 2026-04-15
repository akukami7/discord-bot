import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const REACTIONS = {
  hug: { emoji: '🤗', text: (a, b) => `${a} обнимает ${b}` },
  kiss: { emoji: '💋', text: (a, b) => `${a} целует ${b}` },
  pat: { emoji: '🫳', text: (a, b) => `${a} гладит ${b}` },
  slap: { emoji: '👋', text: (a, b) => `${a} даёт пощёчину ${b}` },
  poke: { emoji: '👉', text: (a, b) => `${a} тыкает ${b}` },
  wave: { emoji: '👋', text: (a, b) => `${a} машет ${b}` },
  highfive: { emoji: '🙏', text: (a, b) => `${a} даёт пять ${b}` },
  bite: { emoji: '😬', text: (a, b) => `${a} кусает ${b}` },
};

export default {
  data: new SlashCommandBuilder()
    .setName('reaction')
    .setDescription('Использовать реакцию')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Тип реакции')
        .setRequired(true)
        .addChoices(
          { name: '🤗 Обнять', value: 'hug' },
          { name: '💋 Поцеловать', value: 'kiss' },
          { name: '🫳 Погладить', value: 'pat' },
          { name: '👋 Пощёчина', value: 'slap' },
          { name: '👉 Тыкнуть', value: 'poke' },
          { name: '👋 Помахать', value: 'wave' },
          { name: '🙏 Дать пять', value: 'highfive' },
          { name: '😬 Укусить', value: 'bite' },
        ))
    .addUserOption(opt => opt.setName('user').setDescription('Кому').setRequired(true)),
  async execute(interaction, client) {
    const type = interaction.options.getString('type');
    const target = interaction.options.getUser('user');
    const reaction = REACTIONS[type];

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'Нельзя использовать реакцию на себе!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setDescription(`${reaction.emoji} ${reaction.text(interaction.user, target)}`)
      .setColor(client.config.embedAccent);

    await interaction.reply({ embeds: [embed] });
  },
};
