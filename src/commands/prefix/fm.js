const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');
const { isOwnerOrManager } = require('../../utils/voiceHelper');

module.exports = {
  name: 'fm',
  description: 'Mute all users in your voice channel',
  usage: '.v fm',
  async execute(message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  			name: 'Paul Dev 🍷', 
 			iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
		})
        .setDescription(`⚠️ <@${message.author.id}> You must join a voice channel first!`)
        .setColor('#ED4245')
    ] });

        // Check ownership or manager status
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  			name: 'Paul Dev 🍷', 
  			iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription(`⚠️ <@${message.author.id}> Only the channel owner or managers can use this command!`)
          .setColor('#FEE75C')
      ] });
    }

        // Mute all users (including the invoker)
    const membersToMute = voiceChannel.members;
    if (membersToMute.size === 0) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  			name: 'Paul Dev 🍷', 
  			iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
		})
        .setDescription(`⚠️ <@${message.author.id}> Aucun membre dans le salon.`)
        .setColor('#FEE75C')
    ] });

    try {
      // Set channel permissions to mute everyone (channel-specific only)
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
        Speak: false
      });

      // Store mute state in Redis for auto-muting new users
      await redis.set(`mute_state:${voiceChannel.id}`, 'true', 'EX', 86400); // 24 hours

      message.reply({ embeds: [
        new EmbedBuilder()
        .setAuthor({ 
  				name: 'Paul Dev 🍷', 
  				  iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			    })
          .setDescription(`✅ <@${message.author.id}> Muted ${membersToMute.size} user(s) in <#${voiceChannel.id}>.`)
          .setColor('#57F287')
      ] });
    } catch (err) {
      console.error(err);
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'Paul Dev 🍷', 
  				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription(`⚠️ <@${message.author.id}> Failed to mute users in the voice channel.`)
          .setColor('#ED4245')
      ] });
    }
  }
};
