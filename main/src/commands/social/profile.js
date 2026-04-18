import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';
import Marriage from '../../models/Marriage.js';
import { formatNumber, formatTime, xpForLevel, progressBar } from '../../utils/helpers.js';

export default {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Посмотреть профиль')
        .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(false)),
    async execute(interaction, client) {
        const target = interaction.options.getUser('user') || interaction.user;

        await interaction.deferReply();

        const user = await User.findOne({ guildId: interaction.guild.id, userId: target.id });
        if (!user) {
            return interaction.editReply({ content: `У ${target.displayName} ещё нет профиля.` });
        }

        const marriage = await Marriage.findOne({
            guildId: interaction.guild.id,
            $or: [{ user1Id: target.id }, { user2Id: target.id }]
        });

        const xpNeeded = xpForLevel(user.level);
        const bar = progressBar(user.xp, xpNeeded, 12);
        const marriageText = marriage
            ? `💍 В браке с <@${marriage.user1Id === target.id ? marriage.user2Id : marriage.user1Id}>`
            : '💔 Не в браке';

        const embed = new EmbedBuilder().setColor(0x2B2D31)
            .setAuthor({ name: target.displayName, iconURL: target.displayAvatarURL() })
            .setThumbnail(target.displayAvatarURL({ size: 256 }))
            .setColor(user.profileColor || client.config.embedAccent)
            .addFields(
                { name: '📊 Уровень', value: `**${user.level}** уровень\n${bar} \`${user.xp}/${xpNeeded}\``, inline: false },
                { name: '💰 Баланс', value: `${formatNumber(user.balance)} монет\n${formatNumber(user.stars)} звёзд`, inline: true },
                { name: '🎙️ Голосовой онлайн', value: formatTime(user.voiceOnline), inline: true },
                { name: '❤️ Отношения', value: marriageText, inline: true },
            );

        if (user.bio) {
            embed.setDescription(`> ${user.bio}`);
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
