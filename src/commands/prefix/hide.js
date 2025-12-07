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
  name: 'hide',
  description: 'Hide your voice channel from other users',
  usage: '.v hide',
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
> **You must be in a voice channel to hide it!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the hide command again

**Usage:** \`.v hide\`
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
> **Only users with premium access can hide voice channels.**
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
            .setDescription('Premium Feature - Hide Channel')
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
      // Hide the channel by removing view permissions
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
        ViewChannel: false
      });

      // Store hidden state in Redis
      await redis.set(`hidden:${voiceChannel.id}`, 'true');

      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Channel Hidden Successfully');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Voice channel hidden successfully!**

**Channel:** <#${voiceChannel.id}>

**What happened:**
• Channel is now hidden from other users
• Only channel members can see it
• Setting will be saved automatically

**To show the channel again:** Use \`.v unhide\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Channel hidden successfully');

      // Section avec thumbnail de succès
      const successSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Success - Channel Hidden')
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
      console.error('[HIDE] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Hide Failed');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to hide the voice channel!**

**Error:** ${error.message}

**What to do:**
• Check if the bot has permission to manage the channel
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error hiding channel');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Hide Failed')
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