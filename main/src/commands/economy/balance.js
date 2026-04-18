import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';
import { formatNumber } from '../../utils/helpers.js';

export default {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Посмотреть баланс')
        .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(false)),
    async execute(interaction, client) {
        const target = interaction.options.getUser('user') || interaction.user;

        await interaction.deferReply();

        const user = await User.findOne({ guildId: interaction.guild.id, userId: target.id });
        const balance = user?.balance || 0;
        const stars = user?.stars || 0;

        const embed = new EmbedBuilder().setColor(0x2B2D31)
            .setTitle(`Текущий баланс — ${target.displayName}`)
            .setThumbnail(target.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: '\u200b', value: `> Монеты:\n\`\`\`\n${formatNumber(balance)}\n\`\`\``, inline: true },
                { name: '\u200b', value: `> Звезды:\n\`\`\`\n${formatNumber(stars)}\n\`\`\``, inline: true }
            );

        await interaction.editReply({ embeds: [embed] });
    },
};
