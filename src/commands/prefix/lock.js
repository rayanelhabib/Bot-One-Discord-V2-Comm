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
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorBuilder
} = require('discord.js');
const { isBotCreatedChannel, isOwnerOrManager } = require('../../utils/voiceHelper');

module.exports = {
  name: 'lock',
  description: 'Lock your voice channel',
  usage: '.v lock',
  async execute(message, args, client) {
    console.log(`[LOCK] Command executed by ${message.author.tag} (${message.author.id})`);
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Voice Channel Required');
        
      const errorText = new TextDisplayBuilder()
        .setContent(`
> **You must join a voice channel first!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the lock command again

**Available Commands:**
• \`.v lock\` - Lock your voice channel
• \`.v unlock\` - Unlock your voice channel
• \`.v showsetup\` - Show channel control panel
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Join a voice channel to continue');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, errorText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Verify that this is a bot-created channel
    console.log(`[LOCK] Checking if channel ${voiceChannel.id} is bot-created`);
    const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
    console.log(`[LOCK] Is bot channel: ${isBotChannel}`);
    if (!isBotChannel) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Bot Channel Required');
        
      const errorText = new TextDisplayBuilder()
        .setContent(`
> **This command only works in channels created by the bot!**

**What to do:**
• Join a temporary voice channel created by the bot
• Use \`.v showsetup\` to see available channels
• Create a new temporary channel if needed

**Available Commands:**
• \`.v lock\` - Lock your voice channel
• \`.v unlock\` - Unlock your voice channel
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Bot channels only');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, errorText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Bot Channel Required')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(errorSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Verify ownership
     // Verify ownership or manager status
    console.log(`[LOCK] Checking permissions for user ${message.author.id}`);
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    console.log(`[LOCK] Has permission: ${hasPermission}`);
    if (!hasPermission) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Permission Denied');
        
      const errorText = new TextDisplayBuilder()
        .setContent(`
> **Only the channel owner can lock the channel!**

**What to do:**
• Ask the channel owner to lock the channel
• Become a manager if the owner allows it
• Create your own temporary channel

**Available Commands:**
• \`.v lock\` - Lock your voice channel (owner only)
• \`.v unlock\` - Unlock your voice channel (owner only)
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Owner permissions required');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, errorText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Permission Denied')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(errorSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    const everyoneRole = message.guild.roles.everyone;
    console.log(`[LOCK] Checking if channel is already locked`);
    const isLocked = await redis.get(`locked:${voiceChannel.id}`) === '1';
    console.log(`[LOCK] Is already locked: ${isLocked}`);

    if (isLocked) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Already Locked');
        
      const errorText = new TextDisplayBuilder()
        .setContent(`
> **Channel is already locked!**

**What to do:**
• Use \`.v unlock\` to unlock the channel
• The channel is currently private to everyone except you
• Only you and managers can join

**Available Commands:**
• \`.v unlock\` - Unlock your voice channel
• \`.v status\` - Check channel status
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Channel already locked');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, errorText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Already Locked')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(errorSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    try {
      console.log(`[LOCK] Starting lock process for channel ${voiceChannel.id} by user ${message.author.id}`);
      
      // Get current permissions to preserve ViewChannel state
      const currentOverwrites = voiceChannel.permissionOverwrites.cache.get(everyoneRole.id);
      const currentViewChannel = currentOverwrites ? currentOverwrites.deny.has(PermissionFlagsBits.ViewChannel) : false;
      
      console.log(`[LOCK] Setting permissions for @everyone and user ${message.author.id}`);
      
      await Promise.all([
        // Deny @everyone from joining
        voiceChannel.permissionOverwrites.edit(everyoneRole, {
          Connect: false
        }),
        // Give basic permissions to the user who executed the command (no dangerous permissions)
        voiceChannel.permissionOverwrites.edit(message.author.id, {
          ViewChannel: true,
          Connect: true,
          Speak: true,
          UseVAD: true,
          Stream: true,
          UseEmbeddedActivities: true,
          UseExternalEmojis: true,
          UseExternalStickers: true,
          AddReactions: true,
          SendMessages: true,
          UseApplicationCommands: true
        }),
        redis.set(`locked:${voiceChannel.id}`, '1')
      ]);
      
      console.log(`[LOCK] Permissions set successfully, sending confirmation message`);
      
      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Channel Locked Successfully');
        
      const successText = new TextDisplayBuilder()
        .setContent(`
> **The voice channel has been locked successfully!**

**What happened:**
• Channel is now private to everyone except you
• Only you and managers can join
• Other users cannot see or join the channel

**Available Commands:**
• \`.v unlock\` - Unlock your voice channel
• \`.v status\` - Check channel status
• \`.v permit @user\` - Allow specific users to join
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Channel locked successfully');

      // Section avec thumbnail de succès
      const successSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, successText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Success - Channel Locked')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(successSection)
        .addSeparatorComponents(separator);

      message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err) {
      console.error('[LOCK] Error in lock command:', err);
      console.error('[LOCK] Error details:', {
        channelId: voiceChannel?.id,
        userId: message.author?.id,
        error: err.message,
        stack: err.stack
      });
      
      try {
        // === DISCORD COMPONENTS V2 ERROR PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ❌ Lock Failed');
          
        const errorText = new TextDisplayBuilder()
          .setContent(`
> **Failed to lock the channel!**

**What to do:**
• Try again in a few moments
• Check if you have the necessary permissions
• Contact an administrator if the problem persists

**Error Details:**
• ${err.message}

**Available Commands:**
• \`.v lock\` - Try locking again
• \`.v status\` - Check channel status
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | Lock operation failed');

        // Section avec thumbnail d'erreur
        const errorSection = new SectionBuilder()
          .addTextDisplayComponents(titleText, errorText, footerText)
          .setThumbnailAccessory(
            thumbnail => thumbnail
              .setDescription('Error - Lock Failed')
              .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
          );

        const separator = new SeparatorBuilder().setDivider(true);
        const container = new ContainerBuilder()
          .addSectionComponents(errorSection)
          .addSeparatorComponents(separator);

        await message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
      } catch (replyError) {
        console.error('[LOCK] Failed to send error message:', replyError);
      }
    }
  }
};