import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Inventory from '../../models/Inventory.js';
import PersonalRole from '../../models/PersonalRole.js';
import PersonalRoom from '../../models/PersonalRoom.js';
import { formatTime } from '../../utils/helpers.js';

export default {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Посмотреть инвентарь'),
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setDescription('Какой из инвентарей Вы хотите посмотреть?')
            .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('inv_cat_roles').setLabel('Личные роли').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('inv_cat_rooms').setLabel('Личные комнаты').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('inv_cat_items').setLabel('Предметы').setStyle(ButtonStyle.Secondary),
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },

    async handleButton(interaction, client) {
        const parts = interaction.customId.split('_');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        // Category selection
        if (parts[1] === 'cat') {
            const category = parts[2];
            await interaction.deferUpdate();

            if (category === 'roles') {
                const roles = await PersonalRole.find({ guildId, userId });

                const lines = roles.map((r, i) => {
                    const role = interaction.guild.roles.cache.get(r.roleId);
                    const status = role ? '✅' : '❌';
                    return `\`${i + 1}.\` ${status} **${r.name}** — ${r.color}`;
                });

                const embed = new EmbedBuilder()
                    .setTitle('🎭 Личные роли')
                    .setDescription(lines.length ? lines.join('\n') : 'У вас нет личных ролей.')
                    .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));

                const back = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('inv_back').setLabel('◀ Назад').setStyle(ButtonStyle.Secondary),
                );

                await interaction.editReply({ embeds: [embed], components: [back] });
            }

            if (category === 'rooms') {
                const rooms = await PersonalRoom.find({ guildId, userId });

                const lines = rooms.map((r, i) => {
                    const channel = interaction.guild.channels.cache.get(r.channelId);
                    const status = channel ? '✅' : '❌';
                    const lock = r.isLocked ? '🔒' : '🔓';
                    return `\`${i + 1}.\` ${status} ${lock} **${r.name}** — ${formatTime(r.voiceOnline)}`;
                });

                const embed = new EmbedBuilder()
                    .setTitle('🏠 Личные комнаты')
                    .setDescription(lines.length ? lines.join('\n') : 'У вас нет личных комнат.')
                    .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));

                const back = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('inv_back').setLabel('◀ Назад').setStyle(ButtonStyle.Secondary),
                );

                await interaction.editReply({ embeds: [embed], components: [back] });
            }

            if (category === 'items') {
                const items = await Inventory.find({ guildId, userId }).populate('itemId');

                const lines = items.map((inv, i) => {
                    const item = inv.itemId;
                    if (!item) return `\`${i + 1}.\` ❓ Неизвестный предмет`;
                    const uses = inv.uses === -1 ? '∞' : inv.uses;
                    return `\`${i + 1}.\` **${item.name}** — Использований: ${uses}`;
                });

                const embed = new EmbedBuilder()
                    .setTitle('🎒 Предметы')
                    .setDescription(lines.length ? lines.join('\n') : 'У вас нет предметов.')
                    .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));

                const back = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('inv_back').setLabel('◀ Назад').setStyle(ButtonStyle.Secondary),
                );

                await interaction.editReply({ embeds: [embed], components: [back] });
            }
        }

        // Back button
        if (parts[1] === 'back') {
            await interaction.deferUpdate();

            const embed = new EmbedBuilder()
                .setDescription('Какой из инвентарей Вы хотите посмотреть?')
                .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('inv_cat_roles').setLabel('Личные роли').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('inv_cat_rooms').setLabel('Личные комнаты').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('inv_cat_items').setLabel('Предметы').setStyle(ButtonStyle.Secondary),
            );

            await interaction.editReply({ embeds: [embed], components: [row] });
        }
    },
};
