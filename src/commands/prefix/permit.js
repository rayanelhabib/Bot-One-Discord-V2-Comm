const { redis } = require('../../redisClient');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
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
      
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
          })
          .setDescription(`⚠️ <@${message.author.id}>  Join ${createChannelMention} First.`)
          .setColor('#ED4245')
      ] });
    }

    // Verify that this is a bot-created channel
    const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
    if (!isBotChannel) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
          })
          .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
          .setDescription('⚠️ This command only works in channels created by the bot!')
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Verify ownership or manager status
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
          })
          .setDescription(`⚠️<@${message.author.id}> Only the channel owner or managers can permit users!`)
          .setColor('#FEE75C')
          
      ] });
    }

    // Check mentions and IDs
    const mentions = message.mentions.members;
    const userIds = args.filter(arg => !arg.startsWith('<@') && /^\d+$/.test(arg));
    
    if (mentions.size === 0 && userIds.length === 0) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
          })
          .setDescription('⚠️ Usage: `.v permit @user1 @user2` or `.v permit <ID1> <ID2>`')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
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
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
          })
          .setTitle('Error')
          .setDescription('ℹ️ No valid users found. Usage: `.v permit @user1 @user2` or `.v permit <ID1> <ID2>`')
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
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
    message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
          name: 'late Night', 
          iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setDescription(`✅ <@${message.author.id}>  Permitted ${usersToPermit.size} user(s) to join the channel!`)
        .setColor('#57F287')
        
    ] });
  }
};