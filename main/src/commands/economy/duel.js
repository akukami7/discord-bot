import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import User from '../../models/User.js';
import Duel from '../../models/Duel.js';
import Transaction from '../../models/Transaction.js';
import { formatNumber, CooldownManager } from '../../../../shared/utils/helpers.js';

const duelCooldown = new CooldownManager();
const COOLDOWN_MS = 10000; // 10 seconds

export default {
  data: new SlashCommandBuilder()
    .setName('duel')
    .setDescription('Бросить вызов на монетку')
    .addUserOption(opt => opt.setName('user').setDescription('Противник').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Ставка').setRequired(true).setMinValue(10).setMaxValue(1000000)),
  async execute(interaction, client) {
    const opponent = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    if (opponent.id === interaction.user.id) return interaction.reply({ content: 'Нельзя вызвать себя!', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: 'Нельзя вызвать бота!', ephemeral: true });

    // Rate limiting
    const cooldownKey = `duel_${interaction.user.id}`;
    if (duelCooldown.isOnCooldown(cooldownKey, COOLDOWN_MS)) {
      const remaining = duelCooldown.getRemainingTime(cooldownKey, COOLDOWN_MS);
      return interaction.reply({ content: `⏳ Подождите ${Math.ceil(remaining / 1000)}с. перед следующим вызовом.`, ephemeral: true });
    }

    await interaction.deferReply();

    const challenger = await User.findOne({ guildId, userId: interaction.user.id });
    if (!challenger || challenger.balance < amount) return interaction.editReply('❌ У вас недостаточно монет!');

    const opponentUser = await User.findOne({ guildId, userId: opponent.id });
    if (!opponentUser || opponentUser.balance < amount) return interaction.editReply(`❌ У ${opponent.displayName} недостаточно монет!`);

    // Check for existing pending duel
    const existing = await Duel.findOne({ guildId, challengerId: interaction.user.id, status: 'pending' });
    if (existing) return interaction.editReply('❌ У вас уже есть активный вызов!');

    const duel = await Duel.create({
      guildId,
      challengerId: interaction.user.id,
      opponentId: opponent.id,
      amount,
    });

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle('⚔️ Вызов на дуэль!')
      .setDescription(`${interaction.user} вызывает ${opponent} на дуэль!\n\nСтавка: **${formatNumber(amount)}** 💰\n\n${opponent}, примите или отклоните вызов.`)
      .setColor(client.config.embedAccent)
      .setFooter({ text: 'Вызов истечёт через 60 секунд' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`duel_accept_${duel._id}`).setLabel('Принять').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`duel_decline_${duel._id}`).setLabel('Отклонить').setStyle(ButtonStyle.Danger),
    );

    const msg = await interaction.editReply({ embeds: [embed], components: [row] });
    await Duel.findByIdAndUpdate(duel._id, { messageId: msg.id });

    // Auto-expire
    setTimeout(async () => {
      const d = await Duel.findById(duel._id);
      if (d && d.status === 'pending') {
        d.status = 'expired';
        await d.save();
        const expEmbed = EmbedBuilder.from(embed).setDescription('⏳ Вызов истёк.').setColor(0x99AAB5);
        await interaction.editReply({ embeds: [expEmbed], components: [] }).catch(() => {});
      }
    }, 60000);
  },

  async handleButton(interaction, client) {
    const [, action, duelId] = interaction.customId.split('_');
    const duel = await Duel.findById(duelId);
    if (!duel || duel.status !== 'pending') {
      return interaction.reply({ content: 'Эта дуэль уже завершена.', ephemeral: true });
    }
    if (interaction.user.id !== duel.opponentId) {
      return interaction.reply({ content: 'Это не ваш вызов!', ephemeral: true });
    }

    await interaction.deferUpdate();

    if (action === 'decline') {
      duel.status = 'expired';
      await duel.save();
      const embed = new EmbedBuilder().setColor(0x2B2D31)
        .setTitle('⚔️ Дуэль отклонена')
        .setDescription(`${interaction.user} отклонил вызов.`)
        .setColor(0xED4245);
      return interaction.editReply({ embeds: [embed], components: [] });
    }

    // Accept — play the duel
    const guildId = duel.guildId;
    const amount = duel.amount;

    // Atomic balance check and update to prevent race condition
    const chResult = await User.findOneAndUpdate(
      { guildId, userId: duel.challengerId, balance: { $gte: amount } },
      { $inc: { balance: -amount } }
    );
    if (!chResult) {
      duel.status = 'expired';
      await duel.save();
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x2B2D31).setDescription('❌ У вызывающего недостаточно монет.').setColor(0xED4245)], components: [] });
    }

    const opResult = await User.findOneAndUpdate(
      { guildId, userId: duel.opponentId, balance: { $gte: amount } },
      { $inc: { balance: -amount } }
    );
    if (!opResult) {
      // Rollback challenger
      await User.findOneAndUpdate(
        { guildId, userId: duel.challengerId },
        { $inc: { balance: amount } }
      );
      duel.status = 'expired';
      await duel.save();
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x2B2D31).setDescription('❌ У принимающего недостаточно монет.').setColor(0xED4245)], components: [] });
    }

    const winnerIsChallenger = Math.random() < 0.5;
    const winnerId = winnerIsChallenger ? duel.challengerId : duel.opponentId;
    const loserId = winnerIsChallenger ? duel.opponentId : duel.challengerId;

    // Winner gets pot (both stakes)
    await User.findOneAndUpdate({ guildId, userId: winnerId }, { $inc: { balance: amount * 2 } });

    await Transaction.create({ guildId, fromId: loserId, toId: winnerId, amount: amount * 2, type: 'duel', description: 'Дуэль: выигрыш' });

    duel.status = 'finished';
    duel.winnerId = winnerId;
    await duel.save();

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle('⚔️ Результат дуэли')
      .setDescription(`🎉 <@${winnerId}> побеждает и забирает **${formatNumber(amount)}** 💰!\n\n😢 <@${loserId}> проиграл.`)
      .setColor(0x57F287);

    await interaction.editReply({ embeds: [embed], components: [] });
  },
};
