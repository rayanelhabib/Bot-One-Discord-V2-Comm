const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'limit',
  description: 'Set user limit for your voice channel',
  usage: '.v limit <number>',
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
> **You must be in a voice channel to set its limit!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the limit command again

**Usage:** \`.v limit <number>\`
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
> **Only the channel owner or managers can set the user limit!**

**Who can set limit:**
• Channel owner (creator)
• Channel managers (co-owners)

**What you can do:**
• Ask the channel owner to set the limit
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
    const limit = parseInt(args[0]);
    if (isNaN(limit)) {
      // === DISCORD COMPONENTS V2 USAGE PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Usage Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Please provide a valid number!**

**Correct Usage:** \`.v limit <number>\`

**Examples:**
• \`.v limit 5\` - Set limit to 5 users
• \`.v limit 10\` - Set limit to 10 users
• \`.v limit 0\` - Remove limit (unlimited)

**Note:** Limit must be between 0 and 99.
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Provide a valid number');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
    
    if (limit < 0 || limit > 99) {
      // === DISCORD COMPONENTS V2 LIMIT ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Invalid Limit');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **User limit must be between 0 and 99!**

**Your input:** ${limit}
**Valid range:** 0-99

**Examples:**
• \`0\` - Unlimited users
• \`5\` - Maximum 5 users
• \`99\` - Maximum 99 users

**Try again with a valid number.**
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Use a number between 0-99');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    try {
      // Set limit and store in Redis
      await Promise.all([
        voiceChannel.setUserLimit(limit),
        redis.set(`limit:${voiceChannel.id}`, limit)
      ]);

      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Success');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **User limit set successfully!**

**Channel:** <#${voiceChannel.id}>
**New Limit:** ${limit === 0 ? 'Unlimited' : `${limit} users`}

**What happened:**
• User limit has been updated
• Setting will be saved automatically
• Limit applies to all users joining the channel

**To change the limit:** Use \`.v limit <number>\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | User limit updated');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
      
    } catch (error) {
      console.error('[LIMIT] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to set user limit!**

**Error:** ${error.message}

**What to do:**
• Check if the bot has permission to manage the channel
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error setting limit');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
