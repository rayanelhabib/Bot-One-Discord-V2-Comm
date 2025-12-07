const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { redis } = require('../../redisClient');
const { isOwnerOrManager } = require('../../utils/voiceHelper');

module.exports = {
  name: 'status',
  description: 'Set your voice channel status using Discord API',
  usage: '.v status [your status message]',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'Paul Dev 🍷', 
            iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
          })
          .setDescription(`⚠️ <@${message.author.id}> You must join a voice channel first!`)
          .setColor('#ED4245')
      ] });
    }

    const statusMessage = args.join(' ').trim();
    if (!statusMessage) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'Paul Dev 🍷', 
            iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
          })
          .setDescription(`⚠️ <@${message.author.id}> Please provide a status message.\nUsage: \".v status <your status>\"`)
          .setColor('#FEE75C')
      ] });
    }

    // Vérification owner/manager
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'Paul Dev 🍷', 
            iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
          })
          .setDescription(`⚠️ <@${message.author.id}> Only the channel owner or managers can set status!`)
          .setColor('#FEE75C')
      ] });
    }

    const url = `https://discord.com/api/v10/channels/${voiceChannel.id}/voice-status`;
    const payload = { status: statusMessage };

    try {
      await axios.put(url, payload, {
        headers: {
          Authorization: `Bot ${client.token}`,
          'Content-Type': 'application/json'
        }
      });

      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'Paul Dev 🍷', 
            iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
          })
          .setDescription(`✅ <@${message.author.id}> Voice status updated to: \"${statusMessage}\"`)
          .setColor('#57F287')
      ] });
    } catch (err) {
      console.error("Failed to update voice status:", err?.response?.data || err.message);
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'Paul Dev 🍷', 
            iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
          })
          .setDescription(`❌ <@${message.author.id}> Failed to update voice status.`)
          .setColor('#ED4245')
      ] });
    }
  }
};
