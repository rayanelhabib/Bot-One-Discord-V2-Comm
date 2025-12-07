const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'blacklist',
  aliases: ['bl'],
  description: 'Manage your persistent blacklist for all your temporary VCs',
  usage: '.v blacklist <add|remove|list> [@user]',
  async execute(message, args, client) {
    const { redis } = require('../../redisClient');
    
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Voice Channel Required');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **You must be in a voice channel to manage blacklist!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the blacklist command again

**Usage:** \`.v blacklist <add|remove|list> [@user]\`
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

    // Validate arguments
    if (args.length === 0) {
      // === DISCORD COMPONENTS V2 USAGE PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Usage Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Please specify an action!**

**Correct Usage:** \`.v blacklist <add|remove|list> [@user]\`

**Examples:**
• \`.v blacklist add @user\` - Add user to blacklist
• \`.v blacklist remove @user\` - Remove user from blacklist
• \`.v blacklist list\` - Show blacklisted users

**What this does:**
• Blacklisted users cannot join your voice channels
• Settings persist across all your channels
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Specify add, remove, or list');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    const action = args[0].toLowerCase();
    const userId = message.mentions.users.first()?.id;

    if (action === 'list') {
      try {
        const blacklist = await redis.smembers(`blacklist:${message.author.id}`);
        
        if (blacklist.length === 0) {
          // === DISCORD COMPONENTS V2 INFO PANEL ===
          const titleText = new TextDisplayBuilder()
            .setContent('# 📋 Blacklist Empty');
            
          const contentText = new TextDisplayBuilder()
            .setContent(`
> **Your blacklist is empty!**

**Channel:** <#${voiceChannel.id}>

**What this means:**
• No users are currently blacklisted
• Anyone can join your voice channels
• You can add users with \`.v blacklist add @user\`
            `);
            
          const footerText = new TextDisplayBuilder()
            .setContent('OneTab - Voice management | No blacklisted users');

          const container = new ContainerBuilder()
            .addTextDisplayComponents(titleText, contentText, footerText);

          return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [container]
          });
        }

        // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# 📋 Blacklisted Users');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`
> **Your blacklisted users (${blacklist.length}):**

${blacklist.map(id => `• <@${id}>`).join('\n')}

**What this means:**
• These users cannot join your voice channels
• Settings apply to all your channels
• Remove users with \`.v blacklist remove @user\`
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | Blacklist management');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
        
      } catch (error) {
        console.error('[BLACKLIST] Error:', error);
        
        // === DISCORD COMPONENTS V2 ERROR PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ❌ Error');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`
> **Failed to get blacklist!**

**Error:** ${error.message}

**What to do:**
• Try again in a few moments
• Contact an administrator if the problem persists
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | Error getting blacklist');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
      }
    }

    if (!userId) {
      // === DISCORD COMPONENTS V2 USAGE PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Usage Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Please mention a user!**

**Correct Usage:** \`.v blacklist ${action} @user\`

**Examples:**
• \`.v blacklist add @user\` - Add user to blacklist
• \`.v blacklist remove @user\` - Remove user from blacklist

**Note:** You must mention the user with @.
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Mention a user');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    try {
      if (action === 'add') {
        await redis.sadd(`blacklist:${message.author.id}`, userId);
        
        // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ✅ User Blacklisted');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`
> **User added to blacklist successfully!**

**User:** <@${userId}>
**Channel:** <#${voiceChannel.id}>

**What happened:**
• User cannot join your voice channels
• Setting applies to all your channels
• User will be automatically kicked if they join

**To remove:** Use \`.v blacklist remove @user\`
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | User blacklisted');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
        
      } else if (action === 'remove') {
        await redis.srem(`blacklist:${message.author.id}`, userId);
        
        // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ✅ User Removed');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`
> **User removed from blacklist successfully!**

**User:** <@${userId}>
**Channel:** <#${voiceChannel.id}>

**What happened:**
• User can now join your voice channels
• Setting applies to all your channels
• User is no longer restricted

**To add back:** Use \`.v blacklist add @user\`
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | User removed from blacklist');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
        
      } else {
        // === DISCORD COMPONENTS V2 USAGE PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ❌ Invalid Action');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`
> **Invalid action specified!**

**Valid actions:** \`add\`, \`remove\`, \`list\`

**Examples:**
• \`.v blacklist add @user\` - Add user to blacklist
• \`.v blacklist remove @user\` - Remove user from blacklist
• \`.v blacklist list\` - Show blacklisted users
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | Use add, remove, or list');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
      }
      
    } catch (error) {
      console.error('[BLACKLIST] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to manage blacklist!**

**Error:** ${error.message}

**What to do:**
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error managing blacklist');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
