const { redis } = require('../../redisClient');
const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorBuilder
} = require('discord.js');
const { isBotCreatedChannel, isOwnerOrManager } = require('../../utils/voiceHelper');

module.exports = {
  name: 'unlock',
  description: 'Unlock your voice channel',
  usage: '.v unlock',
  async execute(message, args, client) {
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
• Then use the unlock command again

**Available Commands:**
• \`.v unlock\` - Unlock your voice channel
• \`.v lock\` - Lock your voice channel
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
    const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
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
• \`.v unlock\` - Unlock your voice channel
• \`.v lock\` - Lock your voice channel
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

     // Verify ownership or manager status
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Permission Denied');
        
      const errorText = new TextDisplayBuilder()
        .setContent(`
> **Only the channel owner can unlock the channel!**

**What to do:**
• Ask the channel owner to unlock the channel
• Become a manager if the owner allows it
• Create your own temporary channel

**Available Commands:**
• \`.v unlock\` - Unlock your voice channel (owner only)
• \`.v lock\` - Lock your voice channel (owner only)
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
    const isLocked = await redis.get(`locked:${voiceChannel.id}`) === '1';

    if (!isLocked) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Already Unlocked');
        
      const errorText = new TextDisplayBuilder()
        .setContent(`
> **Channel is already unlocked!**

**What to do:**
• Use \`.v lock\` to lock the channel
• The channel is currently public to everyone
• Anyone can join the channel

**Available Commands:**
• \`.v lock\` - Lock your voice channel
• \`.v status\` - Check channel status
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Channel already unlocked');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, errorText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Already Unlocked')
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
      await Promise.all([
        // Allow everyone to connect
        voiceChannel.permissionOverwrites.edit(everyoneRole, {
          Connect: null
        }),
        // Restore creator's base permissions (without dangerous permissions)
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
        // Remove all permitted users from Redis when unlocking
        redis.del(`locked:${voiceChannel.id}`),
        redis.del(`permitted_users:${voiceChannel.id}`)
      ]);
      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Channel Unlocked Successfully');
        
      const successText = new TextDisplayBuilder()
        .setContent(`
> **The voice channel has been unlocked successfully!**

**What happened:**
• Channel is now public to everyone
• Anyone can join the channel
• All permitted users have been removed

**Available Commands:**
• \`.v lock\` - Lock your voice channel
• \`.v status\` - Check channel status
• \`.v permit @user\` - Allow specific users to join
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Channel unlocked successfully');

      // Section avec thumbnail de succès
      const successSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, successText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Success - Channel Unlocked')
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
      console.error(err);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Unlock Failed');
        
      const errorText = new TextDisplayBuilder()
        .setContent(`
> **Failed to unlock the channel!**

**What to do:**
• Try again in a few moments
• Check if you have the necessary permissions
• Contact an administrator if the problem persists

**Error Details:**
• ${err.message}

**Available Commands:**
• \`.v unlock\` - Try unlocking again
• \`.v status\` - Check channel status
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Unlock operation failed');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, errorText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Unlock Failed')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(errorSection)
        .addSeparatorComponents(separator);

      message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
