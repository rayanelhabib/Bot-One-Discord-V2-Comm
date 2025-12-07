const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'cam',
  description: 'Enable/disable streaming in your voice channel',
  usage: '.v cam [on/off]',
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
> **You must be in a voice channel to manage streaming!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the cam command again

**Usage:** \`.v cam <on|off>\`
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
> **Only the channel owner or managers can manage streaming!**

**Who can manage streaming:**
• Channel owner (creator)
• Channel managers (co-owners)

**What you can do:**
• Ask the channel owner to manage streaming
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

**Correct Usage:** \`.v cam <on|off>\`

**Examples:**
• \`.v cam on\` - Enable streaming
• \`.v cam off\` - Disable streaming

**What this does:**
• \`on\` - Allows users to stream in the channel
• \`off\` - Prevents users from streaming in the channel
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
      // Set streaming permissions
      const allowStreaming = state === 'on';
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
        Stream: allowStreaming
      });

      // Store state in Redis
      await redis.set(`streaming:${voiceChannel.id}`, allowStreaming.toString());

      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Success');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Streaming ${state === 'on' ? 'enabled' : 'disabled'} successfully!**

**Channel:** <#${voiceChannel.id}>
**Streaming:** ${state === 'on' ? 'Enabled' : 'Disabled'}

**What happened:**
• Streaming permissions have been updated
• Setting will be saved automatically
• ${state === 'on' ? 'Users can now stream in this channel' : 'Users cannot stream in this channel'}

**To change:** Use \`.v cam ${state === 'on' ? 'off' : 'on'}\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Streaming settings updated');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
      
    } catch (error) {
      console.error('[CAM] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to manage streaming permissions!**

**Error:** ${error.message}

**What to do:**
• Check if the bot has permission to manage the channel
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error managing streaming');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
