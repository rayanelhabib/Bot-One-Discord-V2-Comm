const { redis } = require('../../redisClient');
const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');

module.exports = {
  name: 'reset',
  description: 'Reset your temporary voice channel settings to default',
  usage: '.v reset',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('⚠️ Join a voice channel first!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ Erreur');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **⚠️ Only the channel owner can reset it!**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Check cooldown (5 minutes = 300 seconds)
    const cooldownKey = `reset_cooldown:${voiceChannel.id}:${creatorId}`;
    const cooldown = await redis.get(cooldownKey);
    if (cooldown) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ Cooldown');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **⏳ You can reset your channel only once every 5 minutes. Please wait.**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    try {
      // Keep the @everyone overwrite and the bot's own overwrite if any
      const overwritesToKeep = voiceChannel.permissionOverwrites.cache.filter(perm =>
        perm.id === voiceChannel.guild.roles.everyone.id || perm.id === client.user.id
      );

      // Reset permissions: set only the overwrites to keep
      await voiceChannel.permissionOverwrites.set(overwritesToKeep);

      // Reset channel settings
      await voiceChannel.edit({
        name: 'Temp VC',
        bitrate: 64000,
        userLimit: 0,
        rtcRegion: null // auto region
      });

      // Set cooldown key with 5 minutes expiry
      await redis.set(cooldownKey, '1', 'EX', 300);

      message.reply({ embeds: [new EmbedBuilder().setTitle('Réinitialisé').setDescription('✅ Channel settings have been reset to default.').setColor('#5865F2').setFooter({ text: 'OneTab - Gestion vocale' })] });
    } catch (err) {
      console.error(err);
      message.reply({ embeds: [new EmbedBuilder().setTitle('Erreur').setDescription('⚠️ Failed to reset the channel settings.').setColor('#ED4245').setFooter({ text: 'OneTab - Gestion vocale' })] });
    }
  }
};
