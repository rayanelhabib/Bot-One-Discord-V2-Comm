  const { 
    EmbedBuilder, 
    PermissionFlagsBits,
    TextDisplayBuilder,
    ContainerBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
  } = require('discord.js');

  module.exports = {
    name: 'stream',
    description: 'Enable or disable streaming in your voice channel',
    usage: '.v stream <on|off>',
    async execute(message, args, client) {
      const { redis } = require('../../redisClient');
      try {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
          
        // === DISCORD COMPONENTS V2 PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ℹ️ Information');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`> **💌 Join a voice channel first!**`);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
        }

        const creatorId = await redis.get(`creator:${voiceChannel.id}`);
        if (creatorId !== message.author.id) {
          
        // === DISCORD COMPONENTS V2 PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ℹ️ Information');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`> **⚠️ You can only manage your own voice channel!**`);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
        }

        const option = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(option)) {
          
        // === DISCORD COMPONENTS V2 PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ℹ️ Information');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`> **ℹ️ Usage: \`.v stream <on|off>\`**`);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
        }

        const everyoneRole = message.guild.roles.everyone;
        const allowStream = option === 'on';

        await voiceChannel.permissionOverwrites.edit(everyoneRole, {
          Stream: allowStream,
        });

        await voiceChannel.permissionOverwrites.edit(message.author.id, {
          Stream: true,
        });

        
        // === DISCORD COMPONENTS V2 PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ✅ Information');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`> **No description**`);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
      } catch (error) {
        console.error('[STREAM] Error:', error);
        await message.reply('❌ Error managing streaming permissions.').catch(() => {});
      }
    }
  };
