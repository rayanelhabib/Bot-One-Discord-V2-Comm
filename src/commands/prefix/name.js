const { redis } = require('../../redisClient');
const { execute } = require('./claim');
const { EmbedBuilder } = require('discord.js');
const { isOwnerOrManager } = require('../../utils/voiceHelper');


module.exports = {
  name: 'name',
  description: 'Change your voice channel name',
  usage: '.v name <new-name>',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply({ embeds: [new EmbedBuilder().setAuthor({ 
        name: 'late Night', 
       iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
    }).setDescription(`⚠️ <@${message.author.id}> Join a voice channel first!').setColor('#5865F2`)] });
    }

    // Verify ownership or manager status
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      return message.reply({ embeds: [new EmbedBuilder().setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		}).setDescription(`⚠️<@${message.author.id}> Only the channel owner or managers can rename it!`).setColor('#5865F2')] });
    }

    // Get the owner ID for cooldown check
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);

    // Check cooldown (1 minute)
    const cooldownKey = `rename_cooldown:${voiceChannel.id}:${creatorId}`;
    const cooldown = await redis.get(cooldownKey);
    if (cooldown) {
      return message.reply({ embeds: [new EmbedBuilder().setTitle('Cooldown').setDescription('⏳ You can rename your channel only once every 60 seconds. Please wait.').setColor('#5865F2')] });
    }

    // Validate new name
    const newName = args.join(' ').trim();
    if (!newName) return message.reply({ embeds: [new EmbedBuilder().setAuthor({ 
      name: 'late Night', 
     iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
  }).setDescription('⚠️ Usage: `.v name <new-name>`').setColor('#5865F2')] });
    if (newName.length > 100) {
      return message.reply({ embeds: [new EmbedBuilder().setTitle('Erreur').setDescription('⚠️ Name must be under 100 characters!').setColor('#5865F2').setFooter({ text: 'OneTab - Gestion vocale' })] });
    }

    try {
      // Rename channel
      await voiceChannel.setName(newName);

      // Set cooldown with 60 seconds expiry
      await redis.set(cooldownKey, '1', 'EX', 60);

      message.reply({ embeds: [new EmbedBuilder().setAuthor({ 
        name: 'late Night', 
       iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
    }).setDescription(`✅ <@${message.author.id}> Channel renamed to: ${newName}`).setColor('#5865F2')] });
    } catch (error) {
      console.error(error);
      message.reply({ embeds: [new EmbedBuilder().setTitle('Erreur').setDescription('⚠️ Failed to rename channel!')] });
    }
  }
};


