const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'permitrole',
  description: 'Allow a role to join your voice channel',
  usage: '.v permitrole <@role>',
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
> **You must be in a voice channel to permit roles!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the permitrole command again

**Usage:** \`.v permitrole <@role>\`
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
> **Only the channel owner or managers can permit roles!**

**Who can permit roles:**
• Channel owner (creator)
• Channel managers (co-owners)

**What you can do:**
• Ask the channel owner to permit the role
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

**Correct Usage:** \`.v permitrole <@role>\`

**Examples:**
• \`.v permitrole @Members\` - Allow Members role to join
• \`.v permitrole @VIP\` - Allow VIP role to join

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
      // Allow the role to connect to the channel
      await voiceChannel.permissionOverwrites.edit(role, {
        Connect: true,
        ViewChannel: true
      });

      // Store permitted role in Redis
      await redis.sadd(`permitted_roles:${voiceChannel.id}`, role.id);

      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Role Permitted');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Role permitted to join successfully!**

**Role:** <@&${role.id}>
**Channel:** <#${voiceChannel.id}>

**What happened:**
• Role members can now join the channel
• Permission will be saved automatically
• Role members have connect and view permissions

**To revoke:** Use \`.v rejectrole <@role>\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Role permitted successfully');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
      
    } catch (error) {
      console.error('[PERMITROLE] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to permit role!**

**Error:** ${error.message}

**What to do:**
• Check if the bot has permission to manage the channel
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error permitting role');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
