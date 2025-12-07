const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'name',
  description: 'Change your voice channel name',
  usage: '.v name <new-name>',
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
> **You must be in a voice channel to change its name!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the name command again

**Usage:** \`.v name <new-name>\`
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
> **Only the channel owner or managers can change the name!**

**Who can change name:**
• Channel owner (creator)
• Channel managers (co-owners)

**What you can do:**
• Ask the channel owner to change the name
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
    const newName = args.join(' ').trim();
    if (!newName) {
      // === DISCORD COMPONENTS V2 USAGE PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Usage Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Please provide a new channel name!**

**Correct Usage:** \`.v name <new-name>\`

**Examples:**
• \`.v name Gaming Room\`
• \`.v name Music Lounge\`
• \`.v name Study Group\`

**Note:** Channel names can include emojis and special characters.
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Provide a new channel name');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    if (newName.length > 100) {
      // === DISCORD COMPONENTS V2 LENGTH ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Name Too Long');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Channel name is too long!**

**Your name:** ${newName.length} characters
**Maximum allowed:** 100 characters

**What to do:**
• Shorten the channel name
• Remove unnecessary words
• Use abbreviations if needed

**Try again with a shorter name.**
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Channel name too long');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    try {
      // Change channel name and store in Redis
      await Promise.all([
        voiceChannel.setName(newName),
        redis.set(`name:${voiceChannel.id}`, newName)
      ]);

      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Success');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Channel name changed successfully!**

**Channel:** <#${voiceChannel.id}>
**New Name:** \`${newName}\`

**What happened:**
• Channel name has been updated
• Setting will be saved automatically
• New name is visible to all users

**To change the name again:** Use \`.v name <new-name>\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Channel name updated');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
      
    } catch (error) {
      console.error('[NAME] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to change channel name!**

**Error:** ${error.message}

**What to do:**
• Check if the bot has permission to manage the channel
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error changing name');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
