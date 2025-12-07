const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'manager',
  aliases: ['man', 'm'],
  description: 'Manage your voice channel managers (co-owners)',
  usage: '.v manager <add|remove|clear|show> [@user or ID]',
  async execute(message, args, client) {
    try {
    const sub = args[0]?.toLowerCase();
    const userMention = message.mentions.users.first();
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('⚠️ Join a voice channel first!');
    }

    // Check that the user is the owner of the channel and the channel is temporary
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply(`⚠️ <@${message.author.id}> Only the channel owner can manage managers!`);
    }

    // Check if the channel is temporary (created by this bot)
    const isTemporaryChannel = await redis.exists(`creator:${voiceChannel.id}`);
    if (!isTemporaryChannel) {
      return message.reply('⚠️ Managers can only be set for temporary channels created by this bot.');
    }

    const key = `vc:managers:${voiceChannel.id}`;

    if (sub === 'add' || sub === 'a') {
      let targetId = userMention?.id;
      if (!targetId && args[1]) {
        targetId = args[1];
        if (!/^[0-9]+$/.test(targetId)) {
          return message.reply(`⚠️ <@${message.author.id}> You must mention a user or provide their ID.`);
        }
      }
      if (!targetId) return message.reply(`⚠️ <@${message.author.id}> You must mention a user or provide their ID.`);
      if (targetId === message.author.id) return message.reply(`⚠️ <@${message.author.id}> You can\'t add yourself as manager.`);
      const isManager = await redis.sismember(key, targetId);
      if (isManager) return message.reply(`⚠️ <@${targetId}> is already a manager.`);
      await redis.sadd(key, targetId);
      return message.reply(`👥 <@${targetId}> is now a manager (co-owner) of this channel. They can use owner commands in this temporary channel.`);
    }

    if (sub === 'remove' || sub === 'r' || sub === 'rm') {
      let targetId = userMention?.id;
      if (!targetId && args[1]) {
        targetId = args[1];
        if (!/^[0-9]+$/.test(targetId)) {
          return message.reply('🤦‍♂️ You must mention a user or provide their ID.');
        }
      }
      if (!targetId) return message.reply('🤦‍♂️ You must mention a user or provide their ID.');
      const isManager = await redis.sismember(key, targetId);
      if (!isManager) return message.reply(`⚠️ <@${targetId}> is not a manager.`);
      await redis.srem(key, targetId);
      return message.reply(`🗑️ <@${targetId}> is no longer a manager of this channel.`);
    }

    if (sub === 'clear' || sub === 'c') {
      const managers = await redis.smembers(key);
      if (!managers || managers.length === 0) {
        return message.reply('ℹ️ No managers to clear.');
      }
      await redis.del(key);
      return message.reply('🧹 All managers have been removed from this channel.');
    }

    if (sub === 'show' || sub === 's' || sub === 'list' || sub === 'l') {
      const managers = await redis.smembers(key);
      if (!managers || managers.length === 0) {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('ℹ️ No Managers')
            .setDescription('No managers set for this channel.')
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });
      }
      const mentions = managers.map(id => `<@${id}>`).join(', ');
      const embed = new EmbedBuilder()
        .setTitle('👥 Channel Managers')
        .setDescription(mentions)
        .setColor('#5865F2')
        .setFooter({ text: 'OneTab - Voice management' });
      return message.reply({ embeds: [embed] });
    }

    // If no valid subcommand
    return message.reply('ℹ️ Usage: `.v manager <add|remove|clear|show> [@user or ID]`\n\n**Aliases:**\n• `.v man` or `.v m` for manager\n• `add` or `a` for add\n• `remove`, `r`, or `rm` for remove\n• `clear` or `c` for clear\n• `show`, `s`, `list`, or `l` for show');
    } catch (error) {
      console.error('[MANAGER] Error:', error);
      await message.reply('❌ Error managing channel managers.').catch(() => {});
    }
  }
}; 