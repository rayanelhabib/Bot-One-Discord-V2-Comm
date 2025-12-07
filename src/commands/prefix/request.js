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
  name: 'request',
  description: 'Request access to a locked voice channel',
  usage: '.v request <channel-id>',
  async execute(message, args, client) {
    const COOLDOWN_SECONDS = 60;
    const { redis } = require('../../redisClient');

    // Check if channel ID is provided
    if (args.length === 0) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **⚠️ Please provide a channel ID.**

**Usage:** \`.v request <channel-id>\`
**Example:** \`.v request 1234567890123456789\``);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Get channel by ID
    const channelId = args[0];
    const targetChannel = message.guild.channels.cache.get(channelId);

    if (!targetChannel) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **⚠️ Could not find a voice channel with that ID.**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Check if it's a voice channel
    if (targetChannel.type !== ChannelType.GuildVoice) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **⚠️ The provided ID is not a voice channel.**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Check if it's locked
    const isLocked = await redis.get(`locked:${targetChannel.id}`);
    if (isLocked !== '1') {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ ℹ️ Info');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **This channel is not locked.**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Cooldown logic
    const cooldownKey = `cooldown:request:${message.author.id}:${targetChannel.id}`;
    const isOnCooldown = await redis.get(cooldownKey);
    if (isOnCooldown) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ ⏳ Cooldown');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **No description**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Get channel owner
    const ownerId = await redis.get(`creator:${targetChannel.id}`);
    if (!ownerId) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **⚠️ No owner found for this channel.**`);
        
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
      const owner = await message.guild.members.fetch(ownerId);

      await owner.send(`🔔 **${message.author.tag}** is requesting access to your voice channel **${targetChannel.name}** (ID: ${targetChannel.id}) in **${message.guild.name}**.`)
        .catch(() => message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('⚠️ Warning')
            .setDescription('Could not DM the channel owner. They may have DMs disabled.')
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] }));

      await redis.set(cooldownKey, '1', 'EX', COOLDOWN_SECONDS);
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ ✅ Request Sent');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **No description**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err) {
      console.error(err);
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **⚠️ Failed to send the request.**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
