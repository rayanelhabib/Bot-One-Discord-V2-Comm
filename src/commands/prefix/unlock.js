const { redis } = require('../../redisClient');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isBotCreatedChannel, isOwnerOrManager } = require('../../utils/voiceHelper');

module.exports = {
  name: 'unlock',
  description: 'Unlock your voice channel',
  usage: '.v unlock',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  				name: 'late Night', 
 				  iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			  })
        .setDescription(`⚠️ <@${message.author.id}> You must join a voice channel first!`)
        .setColor('#ED4245')
    ] });

    // Verify that this is a bot-created channel
    const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
    if (!isBotChannel) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
        name: 'late Night', 
       iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
     })
          .setDescription('⚠️ This command only works in channels created by the bot!')
          .setColor('#ED4245')
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
          .setDescription(`⚠️<@${message.author.id}> Only the channel owner can unlock the channel!`)
          .setColor('#FEE75C')
          
      ] });
    }

    const everyoneRole = message.guild.roles.everyone;
    const isLocked = await redis.get(`locked:${voiceChannel.id}`) === '1';

    if (!isLocked) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
      name: 'late Night', 
     iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
    })
        .setDescription(`⚠️ <@${message.author.id}> This channel is already unlocked.`)
        .setColor('#FEE75C')
        
    ] });
    
    try {
      await Promise.all([
        // Allow everyone to connect
        voiceChannel.permissionOverwrites.edit(everyoneRole, {
          Connect: null
        }),
        // Restore creator's base permissions (without dangerous permissions)
        voiceChannel.permissionOverwrites.edit(message.author.id, {
          ViewChannel: true,
          Connect: true,
          Speak: true,
          UseVAD: true,
          Stream: true,
          UseEmbeddedActivities: true,
          UseExternalEmojis: true,
          UseExternalStickers: true,
          AddReactions: true,
          SendMessages: true,
          UseApplicationCommands: true
        }),
        // Remove all permitted users from Redis when unlocking
        redis.del(`locked:${voiceChannel.id}`),
        redis.del(`permitted_users:${voiceChannel.id}`)
      ]);
      const embed = new EmbedBuilder()
        .setAuthor({ 
        name: 'late Night', 
       iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
    })
        .setDescription(`✅ <@${message.author.id}> The voice channel has been unlocked successfully.`)
        .setColor('#5865F2')
        ;
      message.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
        name: 'late Night', 
       iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
    })
          .setDescription(`⚠️<@${message.author.id}> Failed to unlock the channel.`)
          .setColor('#ED4245')
      ] });
    }
  }
};
