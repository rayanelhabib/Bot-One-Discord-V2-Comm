const axios = require("axios");
const { 
  EmbedBuilder,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require("discord.js");
const { redis } = require('../../redisClient');
const { isOwnerOrManager } = require('../../utils/voiceHelper');

module.exports = {
  name: 'status',
  description: 'Set your voice channel status using Discord API',
  usage: '.v status [your status message]',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Voice Channel Required');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **You must be in a voice channel to set its status!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the status command again

**Usage:** \`.v status [your status message]\`
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

    const statusMessage = args.join(' ').trim();
    if (!statusMessage) {
      // === DISCORD COMPONENTS V2 USAGE PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Usage Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Please provide a status message!**

**Correct Usage:** \`.v status [your status message]\`

**Examples:**
• \`.v status 🎮 Gaming\`
• \`.v status 🎵 Listening to music\`
• \`.v status 💬 Just chatting\`
• \`.v status 🔴 Live streaming\`

**Note:** Status messages can include emojis and text.
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Provide a status message');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Vérification owner/manager
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      // === DISCORD COMPONENTS V2 PERMISSION PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Permission Denied');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Only the channel owner or managers can set the status!**

**Who can set status:**
• Channel owner (creator)
• Channel managers (co-owners)
• Users with premium access

**What you can do:**
• Ask the channel owner to set the status
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

    const url = `https://discord.com/api/v10/channels/${voiceChannel.id}/voice-status`;
    const payload = { status: statusMessage };

    try {
      await axios.put(url, payload, {
        headers: {
          Authorization: `Bot ${client.token}`,
          'Content-Type': 'application/json'
        }
      });

      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Status Updated');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Voice channel status updated successfully!**

**Channel:** <#${voiceChannel.id}>
**New Status:** \`${statusMessage}\`

**Status is now visible to:**
• All users in the voice channel
• Users viewing the channel list
• Anyone who can see the channel

**To change the status again:**
Use \`.v status [new message]\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Status updated successfully');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err) {
      console.error("Failed to update voice status:", err?.response?.data || err.message);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      let errorMessage = 'Failed to update voice status.';
      if (err.code === 50013) {
        errorMessage = 'I don\'t have permission to manage this channel!';
      } else if (err.code === 10013) {
        errorMessage = 'Channel not found!';
      } else if (err.code === 50035) {
        errorMessage = 'Invalid status message format!';
      }
      
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **${errorMessage}**

**Possible causes:**
• Bot lacks permission to manage the channel
• Channel was deleted or moved
• Status message is too long or invalid
• Discord API is temporarily unavailable

**What to do:**
• Check bot permissions for the channel
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error updating status');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
