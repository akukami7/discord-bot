import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import User from '../../models/User.js';
import Marriage from '../../models/Marriage.js';
import PersonalRole from '../../models/PersonalRole.js';
import CaseUser from '../../../../Cases/src/models/CaseUser.js';
import { formatTime, xpForLevel } from '../../utils/helpers.js';
import { generateProfileCard } from '../../utils/canvasProfile.js';

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

        let marriageText = '💔 Не в браке';
        if (marriage) {
            const partnerId = marriage.user1Id === target.id ? marriage.user2Id : marriage.user1Id;
            try {
                const partner = await client.users.fetch(partnerId);
                marriageText = `С ${partner.username}`;
            } catch (err) {
                marriageText = 'В браке';
            }
        }

        const xpNeeded = xpForLevel(user.level);

        const caseUser = await CaseUser.findOne({ guildId: interaction.guild.id, userId: target.id });
        const casesCount = caseUser ? caseUser.cases : 0;

        const personalRolesCount = await PersonalRole.countDocuments({ guildId: interaction.guild.id, userId: target.id });

        const onlineRank = await User.countDocuments({ guildId: interaction.guild.id, voiceOnline: { $gt: user.voiceOnline } }) + 1;
        const balanceRank = await User.countDocuments({ guildId: interaction.guild.id, balance: { $gt: user.balance } }) + 1;

        try {
            const buffer = await generateProfileCard({
                username: target.displayName,
                avatarURL: target.displayAvatarURL({ extension: 'png', size: 256 }),
                bio: user.bio,
                onlineRank,
                balanceRank,
                balance: user.balance,
                stars: user.stars,
                voiceOnlineFormatted: formatTime(user.voiceOnline),
                messages: user.messages || 0,
                cases: casesCount,
                personalRoles: personalRolesCount,
                level: user.level,
                xp: user.xp,
                nextXp: xpNeeded,
                marriageText
            });

            const attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });
            await interaction.editReply({ files: [attachment] });
        } catch (err) {
            console.error('Canvas error:', err);
            await interaction.editReply({ content: 'Произошла ошибка при генерации профиля.' });
        }
    },
};
