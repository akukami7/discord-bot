import { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Ticket from '../models/Ticket.js';
import TicketBlacklist from '../models/TicketBlacklist.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('Управление системой тикетов')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('blacklist')
                .setDescription('Добавить или убрать пользователя из черного списка тикетов')
                .addUserOption(option => option.setName('user').setDescription('Пользователь').setRequired(true))
                .addStringOption(option => option.setName('action').setDescription('Действие').setRequired(true).addChoices(
                    { name: 'Add', value: 'add' },
                    { name: 'Remove', value: 'remove' }
                ))
                .addStringOption(option => option.setName('reason').setDescription('Причина').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Посмотреть статистику по тикетам')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Установить панель для создания тикетов в текущем канале')
        ),
    async execute(interaction, client) {
        if (interaction.options.getSubcommand() === 'blacklist') {
            const targetUser = interaction.options.getUser('user');
            const action = interaction.options.getString('action');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            await interaction.deferReply({ ephemeral: true });

            if (action === 'add') {
                try {
                    await TicketBlacklist.create({
                        guildId: interaction.guild.id,
                        userId: targetUser.id,
                        addedBy: interaction.user.id,
                        reason
                    });
                    await interaction.editReply(`Пользователь ${targetUser.tag} добавлен в черный список.`);
                } catch (error) {
                    if (error.code === 11000) {
                        await interaction.editReply(`Пользователь ${targetUser.tag} уже в черном списке.`);
                    } else {
                        await interaction.editReply('Произошла ошибка.');
                    }
                }
            } else if (action === 'remove') {
                const result = await TicketBlacklist.findOneAndDelete({ guildId: interaction.guild.id, userId: targetUser.id });
                if (result) {
                    await interaction.editReply(`Пользователь ${targetUser.tag} удален из черного списка.`);
                } else {
                    await interaction.editReply(`Пользователь ${targetUser.tag} не найден в черном списке.`);
                }
            }

        } else if (interaction.options.getSubcommand() === 'stats') {
            await interaction.deferReply();

            const pendingTicketsCount = await Ticket.countDocuments({ guildId: interaction.guild.id, status: 'pending' });
            const openTicketsCount = await Ticket.countDocuments({ guildId: interaction.guild.id, status: 'open' });
            const closedTicketsCount = await Ticket.countDocuments({ guildId: interaction.guild.id, status: 'closed' });

            const embed = new EmbedBuilder().setColor(0x2B2D31)
                .setTitle('Статистика тикетов')
                .addFields(
                    { name: 'Ожидают', value: `${pendingTicketsCount}`, inline: true },
                    { name: 'Открыто', value: `${openTicketsCount}`, inline: true },
                    { name: 'Закрыто', value: `${closedTicketsCount}`, inline: true },
                    { name: 'Всего', value: `${pendingTicketsCount + openTicketsCount + closedTicketsCount}`, inline: true },
                )
                .setColor(client.config.embedColor)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (interaction.options.getSubcommand() === 'setup') {
            await interaction.deferReply({ ephemeral: true });

            const embed = new EmbedBuilder().setColor(0x2B2D31)
                .setTitle('Служба поддержки')
                .setDescription('Нажмите на кнопку ниже, чтобы создать приватный тикет и связаться с администрацией.')
                .setColor(client.config.embedColor);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket_btn')
                        .setLabel('Создать тикет')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );

            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.editReply('Панель тикетов успешно установлена!');
        }
    },
};
