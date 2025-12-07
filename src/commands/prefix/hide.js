const { redis } = require('../../redisClient');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'hide',
  description: 'Hide the voice channel from non-members',
  usage: '.v hide',
  async execute(message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  			name: 'Paul Dev 🍷', 
 			iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
		})
        .setDescription(`⚠️ <@${message.author.id}> Join a voice channel first!`)
        .setColor('#ED4245')
    ] });

    const premiumManager = require('../../utils/premiumManager');
    const hasPremium = await premiumManager.hasPremiumAccess(message.guild.id, message.author.id);
    

    
    if (!hasPremium) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'Paul Dev 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription(`⚠️ <@${message.author.id}> This is a **premium feature**! Only users with premium access can use this command.\n\n💎 Ask an administrator to give you premium access with: `)
          .setColor('#FEE75C')
          
      ] });
    }

    const isHidden = await redis.get(`hidden:${voiceChannel.id}`) === '1';
    if (isHidden) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'Paul Dev 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription(`⚠️<@${message.author.id}> This channel is already hidden.`)
          .setColor('#FEE75C')
          
      ] });
    }
    
    const everyoneRole = message.guild.roles.everyone;
    try {
      // Get current permissions to preserve Connect state
      const currentOverwrites = voiceChannel.permissionOverwrites.cache.get(everyoneRole.id);
      const currentConnect = currentOverwrites ? currentOverwrites.deny.has(PermissionFlagsBits.Connect) : false;
      
      // Save current lock state before hiding
      const isLocked = await redis.get(`locked:${voiceChannel.id}`) === '1';
      if (isLocked) {
        await redis.set(`hidden_lock_state:${voiceChannel.id}`, '1', 'EX', 86400); // 24 hours
      }
      
      // Get the actual owner of the channel
      const ownerId = await redis.get(`creator:${voiceChannel.id}`);
      
      await Promise.all([
        voiceChannel.permissionOverwrites.edit(everyoneRole, {
          ViewChannel: false,
          Connect: currentConnect // Preserve current Connect state
        }),
        voiceChannel.permissionOverwrites.edit(ownerId, {
          ViewChannel: true,
          Connect: true
        }),
        redis.set(`hidden:${voiceChannel.id}`, '1')
      ]);
      
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  			name: 'Paul Dev 🍷', 
 			iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
		  })
          .setDescription(`✅ <@${message.author.id}>Channel is now hidden from others.`)
          .setColor('#57F287')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    } catch (err) {
      console.error(err);
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'Paul Dev 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription(`⚠️<@${message.author.id}> Failed to hide the channel.`)
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }
  }
};
