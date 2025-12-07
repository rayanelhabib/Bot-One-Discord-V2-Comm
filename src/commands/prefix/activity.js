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
const { getGuildConfig } = require('../../utils/configManager');
const { safeGet, safeSet, redisEnabled } = require('../../redisClient');

module.exports = {
    name: 'activity',
    description: 'Toggle activity status for your voice channel',
    usage: '.v activity <on/off>',
    category: 'Voice',
    permissions: [],
    cooldown: 5,
    async execute(message, args) {
        try {
            // Vérifier que l'utilisateur est dans un salon vocal
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Erreur')
                    .setDescription('Vous devez être dans un salon vocal pour utiliser cette commande.')
                    .setTimestamp();
                
                
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ Information');
        
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
            }

            // Vérifier que c'est un salon temporaire créé par ce bot
            if (!redisEnabled) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Erreur')
                    .setDescription('Cette fonctionnalité nécessite Redis qui n\'est pas disponible.')
                    .setTimestamp();
                
                
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ Information');
        
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
            }

            const creatorId = await safeGet(`creator:${voiceChannel.id}`);
            
            if (!creatorId) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Erreur')
                    .setDescription('Ce salon vocal n\'est pas un salon temporaire créé par ce bot.')
                    .setTimestamp();
                
                
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ Information');
        
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
            }

            // Vérifier que l'utilisateur est le créateur du salon
            if (creatorId !== message.author.id) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Erreur')
                    .setDescription('Seul le créateur du salon peut modifier l\'activité.')
                    .setTimestamp();
                
                
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ Information');
        
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
            }

            // Vérifier les arguments
            if (args.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('⚠️ Usage')
                    .setDescription('Utilisez `.v activity <on/off>` pour activer ou désactiver l\'activité.')
                    .addFields(
                        { name: '📝 Exemples', value: '`.v activity on` - Activer l\'activité\n`.v activity off` - Désactiver l\'activité', inline: false }
                    )
                    .setTimestamp();
                
                
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ Information');
        
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
            }

            const state = args[0].toLowerCase();
            
            if (state !== 'on' && state !== 'off') {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Erreur')
                    .setDescription('L\'état doit être `on` ou `off`.')
                    .setTimestamp();
                
                
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ Information');
        
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
            }

            // Mettre à jour l'état de l'activité
            await safeSet(`activity:${voiceChannel.id}`, state === 'on' ? '1' : '0');

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Succès')
                .setDescription(`L'activité du salon **${voiceChannel.name}** a été ${state === 'on' ? 'activée' : 'désactivée'}.`)
                .addFields(
                    { name: '🆔 Salon', value: voiceChannel.name, inline: true },
                    { name: '📊 État', value: state === 'on' ? 'Activé' : 'Désactivé', inline: true }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in activity command:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la modification de l\'activité.')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
};