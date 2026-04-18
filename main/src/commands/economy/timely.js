import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';
import Transaction from '../../models/Transaction.js';
import { formatNumber } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('timely')
    .setDescription('Забрать временную награду'),
  async execute(interaction, client) {
    await interaction.deferReply();

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    let user = await User.findOne({ guildId, userId });
    if (!user) {
      user = await User.create({ guildId, userId });
    }

    const now = Date.now();
    const cooldown = client.config.timelyCooldown;

    if (user.lastTimely && (now - user.lastTimely.getTime()) < cooldown) {
      const remaining = cooldown - (now - user.lastTimely.getTime());
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const cooldownEmbed = new EmbedBuilder().setColor(0x2B2D31)
        .setTitle('Временная награда')
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
        .setDescription(`<@${interaction.user.id}>, Вы **уже** забрали **временную** награду!\nВы можете **получить** следующую через **${hours} ч. ${minutes} мин. ${seconds} сек.**`);

      return interaction.editReply({ embeds: [cooldownEmbed] });
    }

    const amount = client.config.timelyAmount;

    await User.findOneAndUpdate(
      { guildId, userId },
      { $inc: { balance: amount }, $set: { lastTimely: new Date() } }
    );

    await Transaction.create({
      guildId,
      fromId: userId,
      amount,
      type: 'timely',
      description: `Временная награда: +${amount}`,
    });

    const embed = new EmbedBuilder().setColor(0x2B2D31)
      .setTitle(`Временная награда — ${interaction.user.displayName}`)
      .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
      .setDescription(`Вы забрали:\n\`${formatNumber(amount)}\` монет\n\nВозвращайтесь через **24 часа**`);

    await interaction.editReply({ embeds: [embed] });
  },
};
