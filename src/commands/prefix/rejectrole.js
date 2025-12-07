const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'rejectrole',
  description: 'Deny a role from joining your voice channel',
  usage: '.v rejectrole <@role>',
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
> **You must be in a voice channel to reject roles!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the rejectrole command again

**Usage:** \`.v rejectrole <@role>\`
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
> **Only the channel owner or managers can reject roles!**

**Who can reject roles:**
• Channel owner (creator)
• Channel managers (co-owners)

**What you can do:**
• Ask the channel owner to reject the role
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

    // Validate role mention
    const role = message.mentions.roles.first();
    if (!role) {
      // === DISCORD COMPONENTS V2 USAGE PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Usage Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Please mention a role!**

**Correct Usage:** \`.v rejectrole <@role>\`

**Examples:**
• \`.v rejectrole @Members\` - Deny Members role from joining
• \`.v rejectrole @VIP\` - Deny VIP role from joining

**Note:** You must mention the role with @.
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Mention a role');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    try {
      // Deny the role from connecting to the channel
      await voiceChannel.permissionOverwrites.edit(role, {
        Connect: false,
        ViewChannel: false
      });

      // Remove permitted role from Redis
      await redis.srem(`permitted_roles:${voiceChannel.id}`, role.id);

      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Role Rejected');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Role rejected from joining successfully!**

**Role:** <@&${role.id}>
**Channel:** <#${voiceChannel.id}>

**What happened:**
• Role members can no longer join the channel
• Permission will be saved automatically
• Role members are denied connect and view permissions

**To allow:** Use \`.v permitrole <@role>\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Role rejected successfully');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
      
    } catch (error) {
      console.error('[REJECTROLE] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to reject role!**

**Error:** ${error.message}

**What to do:**
• Check if the bot has permission to manage the channel
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error rejecting role');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
