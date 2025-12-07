const { redis } = require('../../redisClient');
const { ChannelType, EmbedBuilder } = require('discord.js');

const COOLDOWN_SECONDS = 60;

module.exports = {
  name: 'request',
  description: 'Request access to a locked voice channel',
  usage: '.v request <channel-id>',
  async execute(message, args, client) {

    // Check if channel ID is provided
    if (args.length === 0) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('❌ Error')
          .setDescription('⚠️ Please provide a channel ID.\n\n**Usage:** `.v request <channel-id>`\n**Example:** `.v request 1234567890123456789`')
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Get channel by ID
    const channelId = args[0];
    const targetChannel = message.guild.channels.cache.get(channelId);

    if (!targetChannel) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('❌ Error')
          .setDescription('⚠️ Could not find a voice channel with that ID.')
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Check if it's a voice channel
    if (targetChannel.type !== ChannelType.GuildVoice) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('❌ Error')
          .setDescription('⚠️ The provided ID is not a voice channel.')
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Check if it's locked
    const isLocked = await redis.get(`locked:${targetChannel.id}`);
    if (isLocked !== '1') {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('ℹ️ Info')
          .setDescription('This channel is not locked.')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Cooldown logic
    const cooldownKey = `cooldown:request:${message.author.id}:${targetChannel.id}`;
    const isOnCooldown = await redis.get(cooldownKey);
    if (isOnCooldown) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('⏳ Cooldown')
          .setDescription(`You already requested access recently. Try again in ${COOLDOWN_SECONDS} seconds.`)
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Get channel owner
    const ownerId = await redis.get(`creator:${targetChannel.id}`);
    if (!ownerId) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('❌ Error')
          .setDescription('⚠️ No owner found for this channel.')
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    try {
      const owner = await message.guild.members.fetch(ownerId);

      await owner.send(`🔔 **${message.author.tag}** is requesting access to your voice channel **${targetChannel.name}** (ID: ${targetChannel.id}) in **${message.guild.name}**.`)
        .catch(() => message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('⚠️ Warning')
            .setDescription('Could not DM the channel owner. They may have DMs disabled.')
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] }));

      await redis.set(cooldownKey, '1', 'EX', COOLDOWN_SECONDS);
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('✅ Request Sent')
          .setDescription(`Request sent to the owner of **${targetChannel.name}** (ID: ${targetChannel.id}).`)
          .setColor('#57F287')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    } catch (err) {
      console.error(err);
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('❌ Error')
          .setDescription('⚠️ Failed to send the request.')
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }
  }
};
