const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'unhide',
  description: 'Make your voice channel visible',
  usage: '.v unhide',
  async execute(message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		})
        .setDescription('💌 Join a voice channel first!')
        .setColor('#ED4245')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });

    const premiumManager = require('../../utils/premiumManager');
    const hasPremium = await premiumManager.hasPremiumAccess(message.guild.id, message.author.id);
    

    
    if (!hasPremium) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
          .setDescription(`⚠️ <@${message.author.id}> This is a **premium feature**! Only users with premium access can use this command.\n\n💎 Ask an administrator to give you premium access with: `)
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    const isHidden = await redis.get(`hidden:${voiceChannel.id}`) === '1';
    if (!isHidden) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		})
          .setDescription('⚠️ This channel is already visible to everyone.')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }
    
    const everyoneRole = message.guild.roles.everyone;
    try {
      // Get current permissions to preserve Connect state
      const currentOverwrites = voiceChannel.permissionOverwrites.cache.get(everyoneRole.id);
      const currentConnect = currentOverwrites ? currentOverwrites.deny.has(PermissionFlagsBits.Connect) : false;
      
      // Check if we need to restore lock state
      const wasLocked = await redis.get(`hidden_lock_state:${voiceChannel.id}`) === '1';
      
      await Promise.all([
        voiceChannel.permissionOverwrites.edit(everyoneRole, {
          ViewChannel: null,
          Connect: wasLocked ? false : (currentConnect ? false : null) // Restore lock state if it was locked
        }),
        redis.del(`hidden:${voiceChannel.id}`),
        wasLocked ? redis.set(`locked:${voiceChannel.id}`, '1') : Promise.resolve(),
        redis.del(`hidden_lock_state:${voiceChannel.id}`)
      ]);
      
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
          .setDescription(`✅ <@${message.author.id}> Channel is now visible to everyone.`)
          .setColor('#57F287')
          
      ] });
    } catch (err) {
      console.error(err);
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
          .setDescription('⚠️ Failed to unhide the channel.')
          .setColor('#ED4245')
      ] });
    }
  }
};
