const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'tlock',
  description: 'Lock text chat in your voice channel (only you can speak)',
  usage: '.v tlock',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		})
        .setDescription('⚠️ Join a voice channel first!')
        .setColor('#ED4245')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });

    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
          .setDescription(`⚠️ <@${message.author.id}> Only the channel owner can lock the VC chat!`)
          .setColor('#FEE75C')
      ] });
    }

    try {
      // Deny @everyone, allow owner
      await voiceChannel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false,
      });

      await voiceChannel.permissionOverwrites.edit(message.author.id, {
        SendMessages: true,
      });

      await redis.set(`tlock:${voiceChannel.id}`, '1');
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
          .setDescription(`✅ <@${message.author.id}> VC chat has been locked. Only you can send messages.`)
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
          .setDescription('⚠️ Failed to lock VC chat.')
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }
  }
};
