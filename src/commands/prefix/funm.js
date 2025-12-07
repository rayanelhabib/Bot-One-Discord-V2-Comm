const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');
const { isOwnerOrManager } = require('../../utils/voiceHelper');

module.exports = {
  name: 'funm',
  description: 'Unmute all users in your voice channel',
  usage: '.v funm',
  async execute(message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [new EmbedBuilder().setAuthor({ 
  				name: 'Paul Dev 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
        .setDescription(`⚠️ <@${message.author.id}> Join a voice channel first!`)
        .setColor('#5865F2')
    ] });

    // Verify ownership or manager status
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setAuthor({ 
  				name: 'Paul Dev 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
        .setDescription(`⚠️ <@${message.author.id}> Only the channel owner or managers can use this command!`)
        .setColor('#FEE75C')
    ] });
    }

    // Remove mutes from all members (including the invoker)
    const membersToUnmute = voiceChannel.members;
    
    if (membersToUnmute.size === 0) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setAuthor({ 
  				name: 'Paul Dev 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
        .setDescription(`⚠️ <@${message.author.id}> Aucun membre dans le salon.`)
        .setColor('#FEE75C')
      ] });
    }

    try {
      // Reset channel permissions to allow speaking (channel-specific only)
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
        Speak: null
      });
      
      // Remove individual mute permissions for all members
      for (const [memberId, member] of membersToUnmute) {
        try {
          await voiceChannel.permissionOverwrites.delete(member);
        } catch (error) {
          console.error(`[FUNM] Failed to remove permissions for ${member.user.username}:`, error.message);
        }
      }
      
      // Clear mute state to disable auto-mute
      await redis.del(`mute_state:${voiceChannel.id}`);
      
      message.reply({ embeds: [new EmbedBuilder()
        .setAuthor({ 
  				name: 'Paul Dev 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription(`✅ <@${message.author.id}> ${membersToUnmute.size} utilisateur(s) ont été démuté(s) dans <#${voiceChannel.id}>. `)
          .setColor('#5865F2')
      ] });
    } catch (error) {
      console.error('[FUNM] Error:', error);
      message.reply({ embeds: [new EmbedBuilder()
        .setAuthor({ 
  				name: 'Paul Dev 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription(`⚠️ <@${message.author.id}> Erreur lors du démutage. Vérifiez les permissions du bot.`)
          .setColor('#ED4245')
      ] });
    }
  }
};