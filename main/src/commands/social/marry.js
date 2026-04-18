import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Marriage from '../../models/Marriage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Заключить или расторгнуть брак')
    .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true)),
  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const guildId = interaction.guild.id;

    if (target.id === interaction.user.id) return interaction.reply({ content: 'Нельзя жениться на себе!', ephemeral: true });
    if (target.bot) return interaction.reply({ content: 'Нельзя жениться на боте!', ephemeral: true });

    await interaction.deferReply();

    // Check if user is already married
    const userMarriage = await Marriage.findOne({
      guildId,
      $or: [{ user1Id: interaction.user.id }, { user2Id: interaction.user.id }]
    });

    // If married to the same person — offer divorce
    if (userMarriage) {
      const partnerId = userMarriage.user1Id === interaction.user.id ? userMarriage.user2Id : userMarriage.user1Id;
      if (partnerId === target.id) {
        await Marriage.findByIdAndDelete(userMarriage._id);
        const embed = new EmbedBuilder().setColor(0x2B2D31)
          .setDescription(`💔 ${interaction.user} и ${target} расторгли брак.`)
          .setColor(0xED4245);
        return interaction.editReply({ embeds: [embed] });
      }
      return interaction.editReply('❌ Вы уже в браке! Сначала разведитесь.');
    }

    // Check if target is already married
    const targetMarriage = await Marriage.findOne({
      guildId,
      $or: [{ user1Id: target.id }, { user2Id: target.id }]
    });
    if (targetMarriage) return interaction.editReply(`❌ ${target.displayName} уже в браке!`);

    // Propose
    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle('💍 Предложение')
      .setDescription(`${interaction.user} предлагает ${target} заключить брак!\n\n${target}, примите или отклоните предложение.`)
      .setColor(0xEB459E);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`marry_accept_${interaction.user.id}_${target.id}`).setLabel('Принять 💍').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`marry_decline_${interaction.user.id}_${target.id}`).setLabel('Отклонить').setStyle(ButtonStyle.Danger),
    );

    await interaction.editReply({ embeds: [embed], components: [row] });

    // Auto-expire after 60s
    setTimeout(async () => {
      try {
        const msg = await interaction.fetchReply();
        if (msg.components.length > 0) {
          const expEmbed = EmbedBuilder.from(embed).setDescription('⏳ Предложение истекло.').setColor(0x99AAB5);
          await interaction.editReply({ embeds: [expEmbed], components: [] });
        }
      } catch (err) {
        // ignore timeout errors
      }
    }, 60000);
  },

  async handleButton(interaction, client) {
    const parts = interaction.customId.split('_');
    const action = parts[1];
    const proposerId = parts[2];
    const targetId = parts[3];
    const guildId = interaction.guild.id;

    if (interaction.user.id !== targetId) {
      return interaction.reply({ content: 'Это предложение не для вас!', ephemeral: true });
    }

    await interaction.deferUpdate();

    if (action === 'decline') {
      const embed = new EmbedBuilder().setColor(0x2B2D31)
        .setDescription(`💔 <@${targetId}> отклонил предложение.`)
        .setColor(0xED4245);
      return interaction.editReply({ embeds: [embed], components: [] });
    }

    // Accept — check neither is married now
    try {
      await Marriage.create({ guildId, user1Id: proposerId, user2Id: targetId });
    } catch (err) {
      // Handle duplicate key error (race condition)
      if (err.code === 11000) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(0x2B2D31).setDescription('❌ Один из пользователей уже в браке.').setColor(0xED4245)],
          components: []
        });
      }
      throw err;
    }

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle('💍 Свадьба!')
      .setDescription(`🎉 <@${proposerId}> и <@${targetId}> теперь в браке! Поздравляем! 🥂`)
      .setColor(0xEB459E);

    await interaction.editReply({ embeds: [embed], components: [] });
  },
};
