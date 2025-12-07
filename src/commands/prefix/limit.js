const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');
const { isOwnerOrManager } = require('../../utils/voiceHelper');

module.exports = {
  name: 'limit',
  description: 'Set user limit for your voice channel',
  usage: '.v limit <number>',
  async execute(message, args, client) {
    try {
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
      // Verify ownership or manager status
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		  })
          .setDescription(`⚠️ <@${message.author.id}> Only the channel owner or managers can set user limits!`)
          .setColor('#FEE75C')
          
      ] });
    }

    // Validate input
    const limit = parseInt(args[0]);
    if (isNaN(limit)) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		})
        .setDescription('⚠️ Usage: `.v limit <number>`')
        .setColor('#FEE75C')
        
    ] });
    if (limit < 0 || limit > 99) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
          .setDescription(`⚠️ <@${message.author.id}> Limit must be between 0-99 (0 = no limit)`)
          .setColor('#ED4245')
          
      ] });
    }

    // Set limit and store in Redis
    await Promise.all([
      voiceChannel.setUserLimit(limit),
      redis.set(`limit:${voiceChannel.id}`, limit)
    ]);

    message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		})
        .setDescription(`✅ <@${message.author.id}> User limit set to **${limit === 0 ? 'unlimited' : limit}**.`)
        .setColor('#57F287')
        
    ] });
    } catch (error) {
      console.error('[LIMIT] Error:', error);
      await message.reply('❌ Error setting user limit.').catch(() => {});
    }
  }
};