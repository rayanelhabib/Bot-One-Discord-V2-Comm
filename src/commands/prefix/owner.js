const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'owner',
  description: 'Check current voice channel owner',
  usage: '.v owner',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		})
        .setDescription('⚠️ You must join a voice channel first!')
        .setColor('#ED4245')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });

    // Get owner from Redis
    const ownerId = await redis.get(`creator:${voiceChannel.id}`);
    if (!ownerId) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		})
        .setDescription('⚠️ This channel has no registered owner.')
        .setColor('#FEE75C')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });

    // Fetch owner details
    try {
      const owner = await message.guild.members.fetch(ownerId);
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
          .setDescription(`⚠️ <@${owner.id}> is the Current Owner of the Channel.`)
          .setColor('#5865F2')
      ] });
    } catch {
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
          .setDescription('⚠️ Original owner left the server.')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }
  }
};