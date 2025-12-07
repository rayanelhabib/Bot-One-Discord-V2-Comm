const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'fm',
  description: 'Mute all users in your voice channel',
  usage: '.v fm',
  async execute(message) {
    const { isOwnerOrManager } = require('../../utils/voiceHelper');
    const { redis } = require('../../redisClient');
    
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Voice Channel Required');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **You must be in a voice channel to mute users!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the mute command again

**Usage:** \`.v fm\`
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
> **Only the channel owner or managers can mute users!**

**Who can mute users:**
• Channel owner (creator)
• Channel managers (co-owners)

**What you can do:**
• Ask the channel owner to mute users
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

    // Mute all users (including the invoker)
    const membersToMute = voiceChannel.members;
    if (membersToMute.size === 0) {
      // === DISCORD COMPONENTS V2 INFO PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ Information');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **No users to mute in this channel!**

**Channel:** <#${voiceChannel.id}>
**Users:** 0

**What to do:**
• Wait for users to join the channel
• Use this command when there are users present
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | No users to mute');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    try {
      // Set channel permissions to mute everyone (channel-specific only)
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
        Speak: false
      });

      // Store mute state in Redis for auto-muting new users
      await redis.set(`mute_state:${voiceChannel.id}`, 'true', 'EX', 86400); // 24 hours

      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Success');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Successfully muted users in the voice channel!**

**Channel:** <#${voiceChannel.id}>
**Users Muted:** ${membersToMute.size} user(s)

**What happened:**
• All users in the channel are now muted
• New users joining will be automatically muted
• Mute state will expire in 24 hours

**To unmute users:** Use \`.v funm\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Users muted successfully');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
      
    } catch (err) {
      console.error(err);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to mute users in the voice channel!**

**Error:** ${err.message}

**What to do:**
• Check if the bot has permission to manage voice states
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error muting users');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
