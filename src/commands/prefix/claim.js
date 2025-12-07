const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');
const { isBotCreatedChannel } = require('../../utils/voiceHelper');

module.exports = {
  name: 'claim',
  description: 'Take ownership of current voice channel',
  usage: '.v claim',
  async execute(message) {
    try {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  				name: 'Paul Dev', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
        .setDescription(`⚠️<@${message.author.id}> You must join a voice channel first!`)
        .setColor('#ED4245')
    ] });

    // Verify that this is a bot-created channel
    const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
    if (!isBotChannel) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'Paul Dev', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription('⚠️ This command only works in channels created by the bot!')
          .setColor('#ED4245')
      ] });
    }

    const currentOwnerId = await redis.get(`creator:${voiceChannel.id}`);
	const ownerId = await redis.get(`creator:${voiceChannel.id}`);
    // If there is an owner, check if they're still in the VC
    if (currentOwnerId) {
      const ownerStillInside = voiceChannel.members.has(currentOwnerId);
      if (ownerStillInside) {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
  				name: 'Paul Dev', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
		 	 })
            .setDescription(`⚠️<@${message.author.id}> This channel already has an active owner is <@${ownerId}> ! `)
            .setColor('#FEE75C')
            
        ] });
      }
    }

    // Assign ownership
    await redis.set(`creator:${voiceChannel.id}`, message.author.id);
    await redis.expire(`creator:${voiceChannel.id}`, 86400); // 24h TTL

    // Note: No automatic permissions granted for security reasons

    message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  				name: 'Paul Dev', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
        .setDescription(`✅ You are <@${message.author.id}> now the owner of this voice channel!`)
        .setColor('#57F287')
        
    ] });
    } catch (error) {
      console.error('[CLAIM] Error:', error);
      await message.reply('❌ Error claiming channel ownership.').catch(() => {});
    }
  }
};
