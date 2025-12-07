const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'tunlock',
  description: 'Unlock your voice channel',
  usage: '.v tunlock',
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
> **You must be in a voice channel to unlock it!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the tunlock command again

**Usage:** \`.v tunlock\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Join a voice channel to continue');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Check ownership or manager status
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      // === DISCORD COMPONENTS V2 PERMISSION PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Permission Denied');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Only the channel owner or managers can unlock the channel!**

**Who can unlock the channel:**
• Channel owner (creator)
• Channel managers (co-owners)

**What you can do:**
• Ask the channel owner to unlock the channel
• Become a manager of this channel
• Create your own voice channel
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Owner/manager access required');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    try {
      // Unlock the channel by restoring connect permissions
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
        Connect: null
      });

      // Remove locked state from Redis
      await redis.del(`tlocked:${voiceChannel.id}`);

      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# 🔓 Channel Unlocked');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Voice channel unlocked successfully!**

**Channel:** <#${voiceChannel.id}>

**What happened:**
• Channel is now open to new users
• Anyone can join the channel
• Setting will be saved automatically

**To lock again:** Use \`.v tlock\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Channel unlocked successfully');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
      
    } catch (error) {
      console.error('[TUNLOCK] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to unlock the voice channel!**

**Error:** ${error.message}

**What to do:**
• Check if the bot has permission to manage the channel
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error unlocking channel');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
