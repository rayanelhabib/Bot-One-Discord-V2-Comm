const { EmbedBuilder } = require('discord.js');

/**
 * Commande pour rejoindre un salon vocal en surveillance
 * Usage: +joinvoice <channel_id>
 */

module.exports = {
  name: 'joinvoice',
  description: 'Rejoindre un salon vocal pour surveillance',
  usage: 'joinvoice <channel_id>',
  aliases: ['jv', 'joinvc'],
  category: 'admin',
  
  async execute(message, args, client) {

    // Vérifier les arguments
    if (!args[0]) {
      return message.reply({
        content: '❌ **Usage incorrect**\n\n`joinvoice <channel_id>`\n\n**Exemple:** `joinvoice 123456789012345678`',
        ephemeral: true
      });
    }

    const channelId = args[0];
    
    // Vérifier si c'est un ID valide
    if (!/^\d{17,19}$/.test(channelId)) {
      return message.reply({
        content: '❌ **ID de salon invalide**\n\nL\'ID doit être un nombre de 17-19 chiffres.',
        ephemeral: true
      });
    }

    try {
      // Vérifier si le salon existe
      const channel = await client.channels.fetch(channelId);
      
      if (!channel) {
        return message.reply({
          content: '❌ **Salon introuvable**\n\nLe salon avec cet ID n\'existe pas ou n\'est pas accessible.',
          ephemeral: true
        });
      }

      if (!channel.isVoiceBased()) {
        return message.reply({
          content: '❌ **Type de salon incorrect**\n\nCe salon n\'est pas un salon vocal.',
          ephemeral: true
        });
      }

      // Vérifier si le bot peut rejoindre le salon
      if (!channel.joinable) {
        return message.reply({
          content: '❌ **Impossible de rejoindre**\n\nLe bot n\'a pas les permissions pour rejoindre ce salon vocal.',
          ephemeral: true
        });
      }

      // Vérifier si déjà en surveillance
      const surveillance = client.voiceSurveillance.surveillanceChannels.get(channelId);
      if (surveillance) {
        return message.reply({
          content: '⚠️ **Déjà en surveillance**\n\nLe bot surveille déjà ce salon vocal.',
          ephemeral: true
        });
      }

      // Vérifier la limite de surveillance
      if (client.voiceSurveillance.surveillanceChannels.size >= client.voiceSurveillance.config.maxSurveillanceChannels) {
        return message.reply({
          content: `❌ **Limite atteinte**\n\nLe bot surveille déjà ${client.voiceSurveillance.config.maxSurveillanceChannels} salons vocaux maximum.`,
          ephemeral: true
        });
      }

      // Rejoindre le salon vocal
      const success = await client.voiceSurveillance.joinVoiceChannel(channelId, message.author.id);
      
      if (success) {
        const embed = new EmbedBuilder()
          .setColor(0x57F287) // Vert
          .setTitle('✅ **Surveillance Vocale Activée**')
          .setDescription(`Le bot a rejoint le salon vocal et restera connecté en permanence.`)
          .addFields(
            { name: '📢 **Salon Vocal**', value: `${channel.name} (${channelId})`, inline: true },
            { name: '👤 **Demandé par**', value: `${message.author.tag}`, inline: true },
            { name: '⏰ **Heure**', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
          )
          .setThumbnail('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
          .setFooter({ text: 'Le bot restera connecté jusqu\'à ce que vous le quittiez manuellement.' });

        await message.reply({ embeds: [embed] });

        // Log de l'activité
        console.log(`[VOICE SURVEILLANCE] ${message.author.tag} (${message.author.id}) joined voice channel ${channel.name} (${channelId})`);
        
      } else {
        await message.reply({
          content: '❌ **Erreur de surveillance**\n\nImpossible de surveiller le salon vocal. Vérifiez que le salon existe et que le bot a les permissions nécessaires.',
          ephemeral: true
        });
      }

    } catch (error) {
      console.error('[VOICE SURVEILLANCE] Error in joinvoice command:', error);
      
      await message.reply({
        content: '❌ **Erreur**\n\nUne erreur est survenue lors de la connexion au salon vocal.',
        ephemeral: true
      });
    }
  }
};
