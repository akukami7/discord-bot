import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import GuildConfig from '../../models/GuildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Настройка систем сервера (Логи, Антикраш)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('joins')
        .setDescription('Настроить канал для логов зашедших участников')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Канал для логов присоединений')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('anticrash')
        .setDescription('Настроить канал для логов Антикраш системы')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Канал для логов Антикраша')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle_anticrash')
        .setDescription('Включить или выключить Антикраш')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Включен ли Антикраш?')
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let config = await GuildConfig.findOne({ guildId });
    if (!config) {
      config = await GuildConfig.create({ guildId });
    }

    if (subcommand === 'joins') {
      const channel = interaction.options.getChannel('channel');
      config.joinLogChannel = channel.id;
      await config.save();

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setDescription(`✅ Канал логов **зашедших участников** успешно установлен на <#${channel.id}>.`);

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'anticrash') {
      const channel = interaction.options.getChannel('channel');
      config.antiCrashLogChannel = channel.id;
      await config.save();

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setDescription(`✅ Канал логов **Антикраша** успешно установлен на <#${channel.id}>.`);

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'toggle_anticrash') {
      const isEnabled = interaction.options.getBoolean('enabled');
      config.antiCrashEnabled = isEnabled;
      await config.save();

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setDescription(`✅ Система **Антикраш** была ${isEnabled ? 'включена' : 'выключена'}.`);

      return interaction.reply({ embeds: [embed] });
    }
  },
};
