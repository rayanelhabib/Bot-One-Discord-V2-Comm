const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'tunlock',
  description: 'Unlock text chat in your voice channel',
  usage: '.v tunlock',
  async execute(message, args, client) {
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

    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply({ embeds: [
        new EmbedBuilder()
        .setAuthor({ 
  				name: 'Paul Dev 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			  })
          .setDescription(`⚠️ <@${message.author.id}> Only the channel owner can unlock the VC chat!`)
          .setColor('#FEE75C')
      ] });
    }

    try {
      // Allow @everyone
      await voiceChannel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: true,
      });

      await redis.set(`tlock:${voiceChannel.id}`, '0');
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'Paul Dev 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription(`✅ <@${message.author.id}> VC chat has been unlocked. Everyone can send messages now.`)
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
          .setDescription(`⚠️ <@${message.author.id}> Failed to unlock VC chat.`)
          .setColor('#ED4245')
      ] });
    }
  }
};
