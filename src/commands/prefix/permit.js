const { redis } = require('../../redisClient');
const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorBuilder
} = require('discord.js');
const { isBotCreatedChannel } = require('../../utils/voiceHelper');
const { getGuildConfig } = require('../../utils/configManager');

// Local function to check if user is owner or manager
async function isOwnerOrManager(channelId, userId) {
  const ownerId = await redis.get(`creator:${channelId}`);
  if (ownerId === userId) return true;
  
  const isManager = await redis.sismember(`vc:managers:${channelId}`, userId);
  return isManager;
}

module.exports = {
  name: 'permit',
  description: 'Allow specific users to join locked channel',
  usage: '.v permit @user1 @user2 ou .v permit <ID1> <ID2>',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      // Récupérer la configuration pour mentionner le salon de création
      const config = await getGuildConfig(message.guild.id);
      const createChannelMention = config.createChannelId ? `<#${config.createChannelId}>` : 'le salon de création';
      
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Voice Channel Required');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **You must be in a voice channel to permit users!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the permit command again

**Usage:** \`.v permit @user1 @user2\` or \`.v permit <ID1> <ID2>\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Join a voice channel to continue');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Voice Channel Required')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(errorSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Verify that this is a bot-created channel
    const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
    if (!isBotChannel) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Bot Channel Required');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **This command only works in channels created by the bot!**

**Channel:** <#${voiceChannel.id}>

**This channel is:**
• A default server channel
• Not a temporary voice channel
• Not created by the bot

**Note:** Only bot-created temporary channels support user permissions.
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Not a bot-created channel');

      // Section avec thumbnail d'information
      const infoSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Information - Bot Channel Required')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(infoSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Verify ownership or manager status
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Permission Denied');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Only the channel owner or managers can permit users!**

**Channel:** <#${voiceChannel.id}>

**Required permissions:**
• Be the channel owner
• Be a channel manager
• Have management permissions

**Note:** Only authorized users can manage channel permissions.
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Permission denied');

      // Section avec thumbnail d'erreur de permissions
      const permissionSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Permission Denied')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(permissionSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Check mentions and IDs
    const mentions = message.mentions.members;
    const userIds = args.filter(arg => !arg.startsWith('<@') && /^\d+$/.test(arg));
    
    if (mentions.size === 0 && userIds.length === 0) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ Usage Information');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Please specify users to permit!**

**Usage examples:**
• \`.v permit @user1 @user2\` - Mention users
• \`.v permit 123456789 987654321\` - Use user IDs
• \`.v permit @user1 123456789\` - Mix mentions and IDs

**What this does:**
• Allows specified users to join the locked channel
• Grants connect permission to the channel
• Stores permission in the system
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Specify users to permit');

      // Section avec thumbnail d'usage
      const usageSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Usage - Permit Command')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(usageSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Collect all users to permit
    const usersToPermit = new Set();
    
    // Add mentioned users
    mentions.forEach(user => usersToPermit.add(user));
    
    // Add users by ID
    for (const userId of userIds) {
      try {
        const user = await message.guild.members.fetch(userId);
        usersToPermit.add(user);
      } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
      }
    }

    if (usersToPermit.size === 0) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ No Valid Users');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **No valid users found to permit!**

**Possible reasons:**
• User IDs are invalid or don't exist
• Users are not in this server
• Mentioned users couldn't be found

**Try again with:**
• Valid user mentions: \`.v permit @user1 @user2\`
• Valid user IDs: \`.v permit 123456789 987654321\`
• Users who are in this server
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | No valid users found');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - No Valid Users')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(errorSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Add permissions for each user and store in Redis
    const results = await Promise.allSettled(
      Array.from(usersToPermit).map(async user => {
        // Give permission to connect
        await voiceChannel.permissionOverwrites.edit(user, {
          Connect: true
        });
        // Store in Redis for the lock system
        await redis.sadd(`permitted_users:${voiceChannel.id}`, user.id);
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
    const titleText = new TextDisplayBuilder()
      .setContent('# ✅ Users Permitted Successfully');
      
    const contentText = new TextDisplayBuilder()
      .setContent(`
> **<@${message.author.id}> Permitted ${successCount} user(s) to join the channel!**

**Channel:** <#${voiceChannel.id}>
**Users permitted:** ${successCount}/${usersToPermit.size}

**What happened:**
• Users can now join the locked channel
• Connect permissions have been granted
• Permissions stored in the system

**Note:** Permitted users can join even when the channel is locked.
      `);
      
    const footerText = new TextDisplayBuilder()
      .setContent('OneTab - Voice management | Users permitted successfully');

    // Section avec thumbnail de succès
    const successSection = new SectionBuilder()
      .addTextDisplayComponents(titleText, contentText, footerText)
      .setThumbnailAccessory(
        thumbnail => thumbnail
          .setDescription('Success - Users Permitted')
          .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
      );

    const separator = new SeparatorBuilder().setDivider(true);
    const container = new ContainerBuilder()
      .addSectionComponents(successSection)
      .addSeparatorComponents(separator);

    return message.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    });
  }
};