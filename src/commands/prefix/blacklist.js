const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'blacklist',
  aliases: ['bl'],
  description: 'Manage your persistent blacklist for all your temporary VCs',
  usage: '.v blacklist <add|remove|list|clear> [@user or ID]',
  async execute(message, args) {
    const sub = args[0];
    const userMention = message.mentions.users.first();

    const voiceChannel = message.member.voice.channel;
    let isOwner = false;

    if (voiceChannel) {
      const creatorId = await redis.get(`creator:${voiceChannel.id}`);
      isOwner = creatorId === message.author.id;
    }

    const key = `vc:blacklist:${message.author.id}`;

    if (sub === 'add') {
      let targetId = userMention?.id;
      if (!targetId && args[1]) {
        targetId = args[1];
        if (!/^[0-9]+$/.test(targetId)) {
          return message.reply({ embeds: [
            new EmbedBuilder()
              .setTitle('⚠️ Usage')
              .setDescription('❓ Usage: `.v blacklist add @user` or `.v bl add @user`')
              .setColor('#FEE75C')
              .setFooter({ text: 'OneTab - Voice management' })
          ] });
        }
      }
      if (!targetId)
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('⚠️ Usage')
            .setDescription('❓ Usage: `.v blacklist add @user` or `.v bl add @user`')
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });
      if (targetId === message.author.id)
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('⛔ Not Allowed')
            .setDescription('⚠️ You can\'t blacklist yourself.')
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });
      const isBlacklisted = await redis.sismember(key, targetId);
      if (isBlacklisted)
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('⚠️ Already Blacklisted')
            .setDescription(`⚠️ <@${targetId}> is already blacklisted.`)
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });
      // Auto-remove from whitelist
      await redis.srem(`vc:whitelist:${message.author.id}`, targetId);
      await redis.sadd(key, targetId);
      if (voiceChannel && isOwner) {
        try {
          await voiceChannel.permissionOverwrites.edit(targetId, {
            Connect: false,
            ViewChannel: false,
          });
        } catch (err) {
          console.error('Failed to apply blacklist permissions:', err);
        }
      }
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('🚫 Blacklisted')
          .setDescription(`<@${targetId}> is now blacklisted. They'll be blocked from joining your future VCs.`)
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    if (sub === 'remove') {
      let targetId = userMention?.id;
      if (!targetId && args[1]) {
        targetId = args[1];
        if (!/^\d+$/.test(targetId)) {
          return message.reply('⚠️ You must mention a user or provide their ID to remove.');
        }
      }
      
      if (!targetId)
        return message.reply('⚠️ You must mention a user or provide their ID to remove.');

      const isBlacklisted = await redis.sismember(key, targetId);
      if (!isBlacklisted)
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('⚠️ Not Blacklisted')
            .setDescription(`⚠️ <@${targetId}> is not in your blacklist.`)
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });

      await redis.srem(key, targetId);

      if (voiceChannel && isOwner) {
        try {
          await voiceChannel.permissionOverwrites.delete(targetId);
        } catch (err) {
          console.error('Failed to remove blacklist permissions:', err);
        }
      }

      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('✅ Removed')
          .setDescription(`✅ Removed <@${targetId}> from your blacklist.`)
          .setColor('#57F287')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    if (sub === 'list') {
      const ids = await redis.smembers(key);
      if (!ids.length) return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle(' Empty Blacklist')
          .setDescription('⚠️ Your blacklist is empty.')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });

      const names = await Promise.all(
        ids.map(async (id) => {
          try {
            const member = await message.guild.members.fetch(id);
            return member.user.tag;
          } catch {
            return `❓ Unknown (${id})`;
          }
        })
      );

      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('📄 Blacklisted Users')
          .setDescription(`📄 Your blacklisted users:\n${names.join('\n')}`)
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    if (sub === 'clear') {
      const ids = await redis.smembers(key);
      if (!ids.length) return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle(' Already Empty')
          .setDescription('⚠️ Your blacklist is already empty.')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });

      if (voiceChannel && isOwner) {
        for (const id of ids) {
          try {
            await voiceChannel.permissionOverwrites.delete(id);
          } catch {
            // Ignore
          }
        }
      }

      await redis.del(key);
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('🗑️ Cleared')
          .setDescription('🗑️ Cleared your blacklist. This affects all future VCs you create.')
          .setColor('#57F287')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#FEE75C')
          .setTitle('⚠️ Usage')
          .setDescription('❓ Usage: `.v blacklist <add|remove|list|clear> [@user or ID]`\n💡 Your blacklist blocks users from all future VCs you create.')
          .setFooter({ text: 'OneTab - Voice management' }),
      ],
    });
  },
};
