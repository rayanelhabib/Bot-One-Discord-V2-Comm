const axios = require("axios");
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require("discord.js");
const { redis } = require('../../redisClient');

module.exports = {
  name: 'status',
  description: 'Set your voice channel status using Discord API',
  usage: '.v status [your status message]',
  async execute(message, args, client) {
    const sendReply = (content) => {
      const textComponent = new TextDisplayBuilder().setContent(content);
      const containerComponent = new ContainerBuilder().addTextDisplayComponents(textComponent);
      message.channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [containerComponent],
      });
    };

    const userId = message.author.id;
    const member = message.guild.members.cache.get(userId);
    const voiceChannel = member?.voice?.channel;

    const statusMessage = args.join(' ').trim();
    if (!statusMessage) {
      return sendReply('Please provide a status message.\nUsage: `.v status <your status>`');
    }

    if (!voiceChannel) {
      return sendReply('You must be connected to a voice channel to use this command.');
    }

    // Verify ownership - only channel owner can set status
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return sendReply('⚠️ Only the channel owner can set status!');
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

      return sendReply(`✅ Voice status updated to: \`${statusMessage}\``);
    } catch (err) {
      console.error("Failed to update voice status:", err?.response?.data || err.message);
      return sendReply('❌ Failed to update voice status.');
    }
  }
};
