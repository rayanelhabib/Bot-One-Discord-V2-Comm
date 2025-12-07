const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'sb',
  description: 'Enable or disable screen sharing in your voice channel',
  usage: '.v sb <on|off>',
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
> **You must be in a voice channel to manage screen sharing!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the sb command again

**Usage:** \`.v sb <on|off>\`
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
> **Only the channel owner or managers can manage screen sharing!**

**Who can manage screen sharing:**
• Channel owner (creator)
• Channel managers (co-owners)

**What you can do:**
• Ask the channel owner to manage screen sharing
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

    // Validate input
    const state = args[0]?.toLowerCase();
    if (!state || !['on', 'off'].includes(state)) {
      // === DISCORD COMPONENTS V2 USAGE PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Usage Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Please specify 'on' or 'off'!**

**Correct Usage:** \`.v sb <on|off>\`

**Examples:**
• \`.v sb on\` - Enable screen sharing
• \`.v sb off\` - Disable screen sharing

**What this does:**
• \`on\` - Allows users to share their screen
• \`off\` - Prevents users from sharing their screen
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Use on or off');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    try {
      // Set screen share permissions
      const allowScreenShare = state === 'on';
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
        UseApplicationCommands: allowScreenShare
      });

      // Store state in Redis
      await redis.set(`screen_share:${voiceChannel.id}`, allowScreenShare.toString());

      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Success');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Screen sharing ${state === 'on' ? 'enabled' : 'disabled'} successfully!**

**Channel:** <#${voiceChannel.id}>
**Screen Sharing:** ${state === 'on' ? 'Enabled' : 'Disabled'}

**What happened:**
• Screen sharing permissions have been updated
• Setting will be saved automatically
• ${state === 'on' ? 'Users can now share their screen' : 'Users cannot share their screen'}

**To change:** Use \`.v sb ${state === 'on' ? 'off' : 'on'}\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Screen sharing settings updated');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
      
    } catch (error) {
      console.error('[SB] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to manage screen sharing permissions!**

**Error:** ${error.message}

**What to do:**
• Check if the bot has permission to manage the channel
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error managing screen sharing');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
