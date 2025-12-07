const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'whitelist',
  aliases: ['wl'],
  description: 'Manage your persistent whitelist for all your temporary VCs',
  usage: '.v whitelist <add|remove|list> [@user]',
  async execute(message, args, client) {
    const { redis } = require('../../redisClient');
    
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Voice Channel Required');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **You must be in a voice channel to manage whitelist!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the whitelist command again

**Usage:** \`.v whitelist <add|remove|list> [@user]\`
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

**Correct Usage:** \`.v whitelist <add|remove|list> [@user]\`

**Examples:**
• \`.v whitelist add @user\` - Add user to whitelist
• \`.v whitelist remove @user\` - Remove user from whitelist
• \`.v whitelist list\` - Show whitelisted users

**What this does:**
• Only whitelisted users can join your voice channels
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
        const whitelist = await redis.smembers(`whitelist:${message.author.id}`);
        
        if (whitelist.length === 0) {
          // === DISCORD COMPONENTS V2 INFO PANEL ===
          const titleText = new TextDisplayBuilder()
            .setContent('# 📋 Whitelist Empty');
            
          const contentText = new TextDisplayBuilder()
            .setContent(`
> **Your whitelist is empty!**

**Channel:** <#${voiceChannel.id}>

**What this means:**
• No users are currently whitelisted
• Anyone can join your voice channels
• You can add users with \`.v whitelist add @user\`
            `);
            
          const footerText = new TextDisplayBuilder()
            .setContent('OneTab - Voice management | No whitelisted users');

          const container = new ContainerBuilder()
            .addTextDisplayComponents(titleText, contentText, footerText);

          return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [container]
          });
        }

        // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# 📋 Whitelisted Users');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`
> **Your whitelisted users (${whitelist.length}):**

${whitelist.map(id => `• <@${id}>`).join('\n')}

**What this means:**
• Only these users can join your voice channels
• Settings apply to all your channels
• Remove users with \`.v whitelist remove @user\`
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | Whitelist management');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
        
      } catch (error) {
        console.error('[WHITELIST] Error:', error);
        
        // === DISCORD COMPONENTS V2 ERROR PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ❌ Error');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`
> **Failed to get whitelist!**

**Error:** ${error.message}

**What to do:**
• Try again in a few moments
• Contact an administrator if the problem persists
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | Error getting whitelist');

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

**Correct Usage:** \`.v whitelist ${action} @user\`

**Examples:**
• \`.v whitelist add @user\` - Add user to whitelist
• \`.v whitelist remove @user\` - Remove user from whitelist

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
        await redis.sadd(`whitelist:${message.author.id}`, userId);
        
        // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ✅ User Whitelisted');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`
> **User added to whitelist successfully!**

**User:** <@${userId}>
**Channel:** <#${voiceChannel.id}>

**What happened:**
• User can now join your voice channels
• Setting applies to all your channels
• Only whitelisted users can join

**To remove:** Use \`.v whitelist remove @user\`
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | User whitelisted');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
        
      } else if (action === 'remove') {
        await redis.srem(`whitelist:${message.author.id}`, userId);
        
        // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ✅ User Removed');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`
> **User removed from whitelist successfully!**

**User:** <@${userId}>
**Channel:** <#${voiceChannel.id}>

**What happened:**
• User can no longer join your voice channels
• Setting applies to all your channels
• User is no longer whitelisted

**To add back:** Use \`.v whitelist add @user\`
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | User removed from whitelist');

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
• \`.v whitelist add @user\` - Add user to whitelist
• \`.v whitelist remove @user\` - Remove user from whitelist
• \`.v whitelist list\` - Show whitelisted users
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
      console.error('[WHITELIST] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to manage whitelist!**

**Error:** ${error.message}

**What to do:**
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error managing whitelist');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
