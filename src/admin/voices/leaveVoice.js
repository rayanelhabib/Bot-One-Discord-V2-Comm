const { EmbedBuilder } = require('discord.js');

/**
 * Commande pour quitter un salon vocal de surveillance
 * Usage: +leavevoice <channel_id>
 */

module.exports = {
  name: 'leavevoice',
  description: 'Quitter un salon vocal de surveillance',
  usage: 'leavevoice <channel_id>',
  aliases: ['lv', 'leavevc'],
  category: 'admin',
  
  async execute(message, args, client) {

    // Vérifier les arguments
    if (!args[0]) {
      return message.reply({
        content: '❌ **Usage incorrect**\n\n`leavevoice <channel_id>`\n\n**Exemple:** `leavevoice 123456789012345678`',
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
      // Vérifier si le salon est en surveillance
      const surveillance = client.voiceSurveillance.surveillanceChannels.get(channelId);
      if (!surveillance) {
        return message.reply({
          content: '⚠️ **Pas en surveillance**\n\nCe salon vocal n\'est pas surveillé par le bot.',
          ephemeral: true
        });
      }

      // Quitter le salon vocal
      const success = await client.voiceSurveillance.leaveVoiceChannel(channelId);
      
      if (success) {
        const embed = new EmbedBuilder()
          .setColor(0xED4245) // Rouge
          .setTitle('✅ **Surveillance Vocale Désactivée**')
          .setDescription(`Le bot a quitté le salon vocal.`)
          .addFields(
            { name: '📢 **Salon Vocal**', value: `<#${channelId}> (${channelId})`, inline: true },
            { name: '👤 **Demandé par**', value: `${message.author.tag}`, inline: true },
            { name: '⏰ **Heure**', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
          )
          .setThumbnail('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
          .setFooter({ text: 'La surveillance de ce salon vocal a été arrêtée.' });

        await message.reply({ embeds: [embed] });

        // Log de l'activité
        console.log(`[VOICE SURVEILLANCE] ${message.author.tag} (${message.author.id}) left voice channel ${channelId}`);
        
      } else {
        await message.reply({
          content: '❌ **Erreur de déconnexion**\n\nImpossible de quitter le salon vocal.',
          ephemeral: true
        });
      }

    } catch (error) {
      console.error('[VOICE SURVEILLANCE] Error in leavevoice command:', error);
      
      await message.reply({
        content: '❌ **Erreur**\n\nUne erreur est survenue lors de la déconnexion du salon vocal.',
        ephemeral: true
      });
    }
  }
};
