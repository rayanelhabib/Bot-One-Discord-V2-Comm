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

module.exports = {
  name: 'unhide',
  description: 'Show your voice channel to other users',
  usage: '.v unhide',
  async execute(message, args, client) {
    const { isOwnerOrManager } = require('../../utils/voiceHelper');
    const { redis } = require('../../redisClient');
    
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Voice Channel Required');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **You must be in a voice channel to show it!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the unhide command again

**Usage:** \`.v unhide\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Join a voice channel to continue');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Voice Channel Required')
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

    // Check premium access (PREMIUM ONLY - NO EXCEPTIONS)
    const premiumManager = require('../../utils/premiumManager');
    const hasPremium = await premiumManager.hasPremiumAccess(message.guild.id, message.author.id);
    
    if (!hasPremium) {
      // === DISCORD COMPONENTS V2 PREMIUM PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# 💎 Premium Feature Required');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **<@${message.author.id}> This is a premium feature!**
> **Only users with premium access can show hidden voice channels.**
> **💎 Ask an administrator to give you premium access**

**What you can do:**
• Contact an administrator for premium access
• Use other voice channel features
• Create your own voice channel
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Premium access required');

      // Section avec thumbnail premium
      const premiumSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Premium Feature - Unhide Channel')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(premiumSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    try {
      // Show the channel by restoring view permissions
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
        ViewChannel: null
      });

      // Remove hidden state from Redis
      await redis.del(`hidden:${voiceChannel.id}`);

      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Channel Shown Successfully');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Voice channel shown successfully!**

**Channel:** <#${voiceChannel.id}>

**What happened:**
• Channel is now visible to all users
• Everyone can see and join the channel
• Setting will be saved automatically

**To hide the channel again:** Use \`.v hide\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Channel shown successfully');

      // Section avec thumbnail de succès
      const successSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Success - Channel Shown')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(successSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
      
    } catch (error) {
      console.error('[UNHIDE] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Unhide Failed');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to show the voice channel!**

**Error:** ${error.message}

**What to do:**
• Check if the bot has permission to manage the channel
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error showing channel');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Unhide Failed')
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
  }
};