const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'whitelist',
  aliases: ['wl'], // Added alias for .v wl
  description: 'Manage your persistent whitelist for all your temporary VCs',
  usage: '.v whitelist <add|remove|list|clear> [@user or ID]',
  async execute(message, args) {
    const sub = args[0];
    const userMention = message.mentions.users.first();

    // Check if user is in a voice channel (context but optional)
    const voiceChannel = message.member.voice.channel;
    let isOwner = false;

    if (voiceChannel) {
      const creatorId = await redis.get(`creator:${voiceChannel.id}`);
      isOwner = creatorId === message.author.id;
    }

    // Redis key for whitelist owner = message author
    const key = `vc:whitelist:${message.author.id}`;

    if (sub === 'add') {
      let targetId = userMention?.id;
      if (!targetId && args[1]) {
        targetId = args[1];
        if (!/^\d+$/.test(targetId)) {
          return message.reply({ embeds: [
            new EmbedBuilder()
              .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			  })
              .setDescription('❓ Usage: `.v whitelist add @user` or `.v wl add @user`')
              .setColor('#FEE75C')
              .setFooter({ text: 'OneTab - Voice management' })
          ] });
        }
      }
      if (!targetId)
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
            .setDescription('❓ Usage: `.v whitelist add @user` or `.v wl add @user`')
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });
      if (targetId === message.author.id)
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('⛔ Not Allowed')
            .setDescription('⚠️ You can\'t whitelist yourself.')
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });
      const isWhitelisted = await redis.sismember(key, targetId);
      if (isWhitelisted)
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
            .setDescription(`⚠️ <@${targetId}> is already whitelisted.`)
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });
      // Auto-remove from blacklist
      await redis.srem(`vc:blacklist:${message.author.id}`, targetId);
      await redis.sadd(key, targetId);
      if (voiceChannel && isOwner) {
        try {
          await voiceChannel.permissionOverwrites.edit(targetId, {
            Connect: true,
            ViewChannel: true,
          });
        } catch (error) {
          console.error('Failed to set permissions on current channel:', error);
        }
      }
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ Whitelisted')
            .setDescription(`✅ Added <@${targetId}> to your whitelist. They'll be able to join all your future VCs!`)
            .setFooter({ text: 'OneTab - Voice management' }),
        ],
      });
    }

    if (sub === 'remove') {
      let targetId = userMention?.id;
      if (!targetId && args[1]) {
        targetId = args[1];
        if (!/^\d+$/.test(targetId)) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor('#FF0000')
                .setAuthor({ 
  					name: 'late Night', 
 					iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
				})
                .setDescription('⚠️ You must mention a user or provide their ID to remove.')
                .setFooter({ text: 'Your whitelist applies to all VCs you create!' }),
            ],
          });
        }
      }
      
      if (!targetId)
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('Error')
              .setDescription('⚠️ You must mention a user or provide their ID to remove.')
              .setFooter({ text: 'Your whitelist applies to all VCs you create!' }),
          ],
        });

      const isWhitelisted = await redis.sismember(key, targetId);
      if (!isWhitelisted)
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('Error')
              .setDescription(`⚠️ <@${targetId}> is not in your whitelist.`)
              .setFooter({ text: 'Your whitelist applies to all VCs you create!' }),
          ],
        });

      await redis.srem(key, targetId);

      if (voiceChannel && isOwner) {
        try {
          await voiceChannel.permissionOverwrites.delete(targetId);
        } catch (error) {
          console.error('Failed to remove permissions from current channel:', error);
        }
      }

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Success')
            .setDescription(`✅ Removed <@${targetId}> from your whitelist.`)
            .setFooter({ text: 'Your whitelist applies to all VCs you create!' }),
        ],
      });
    }

    if (sub === 'list') {
      const ids = await redis.smembers(key);
      if (!ids.length) return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Error')
            .setDescription('⚠️ Your whitelist is empty.')
            .setFooter({ text: 'Your whitelist applies to all VCs you create!' }),
        ],
      });

      const names = await Promise.all(
        ids.map(async (id) => {
          try {
            const member = await message.guild.members.fetch(id);
            return member.user.tag;
          } catch {
            return `❓ Unknown User (${id})`;
          }
        })
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Success')
            .setDescription(`📄 Your whitelisted users (applies to all your VCs):\n${names.join('\n')}`)
            .setFooter({ text: 'Your whitelist applies to all VCs you create!' }),
        ],
      });
    }

    if (sub === 'clear') {
      const ids = await redis.smembers(key);
      if (!ids.length) return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle('ℹ️ Whitelist Empty')
            .setDescription('⚠️ Your whitelist is already empty.')
            .setFooter({ text: 'OneTab - Voice management' }),
        ],
      });

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
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ Whitelist Cleared')
            .setDescription('🗑️ Cleared your whitelist. This affects all future VCs you create.')
            .setFooter({ text: 'OneTab - Voice management' }),
        ],
      });
    }

    // Default help message
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#FEE75C')
          .setTitle('ℹ️ Usage')
          .setDescription('❓ Usage: `.v whitelist <add|remove|list|clear> [@user or ID]`')
          .setFooter({ text: 'OneTab - Voice management' }),
      ],
    });
  }
};
