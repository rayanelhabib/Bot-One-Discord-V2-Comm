const { EmbedBuilder } = require('discord.js');

/**
 * Commande pour voir le statut de la surveillance vocale
 * Usage: +voicestatus
 */

module.exports = {
  name: 'voicestatus',
  description: 'Voir le statut de la surveillance vocale',
  usage: '+voicestatus',
  aliases: ['vs', 'voicestat'],
  category: 'admin',
  permissions: ['Administrator'],
  
  async execute(message, args, client) {
    try {
      const stats = client.voiceSurveillance.getStats();
      const surveillanceChannels = stats.channels;
      
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🔊 **Statut de la Surveillance Vocale**')
        .setDescription('Informations sur l\'état de la surveillance vocale du bot.')
        .setThumbnail('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        .setTimestamp();

      // Informations générales
      embed.addFields(
        { 
          name: '📊 **Statistiques Générales**', 
          value: [
            `**Salons surveillés:** ${stats.totalChannels}`,
            `**Monitoring actif:** ${stats.isMonitoring ? '✅ Oui' : '❌ Non'}`,
            `**Limite max:** ${client.voiceSurveillance.config.maxSurveillanceChannels}`
          ].join('\n'), 
          inline: true 
        }
      );

      // Salons en surveillance
      if (surveillanceChannels.length > 0) {
        const channelsInfo = surveillanceChannels.map((channel, index) => {
          const duration = Math.floor(channel.duration / 1000 / 60); // en minutes
          return `**${index + 1}.** <#${channel.channelId}>\n` +
                 `└ 👤 <@${channel.userId}>\n` +
                 `└ ⏱️ ${duration}min\n` +
                 `└ ${channel.isActive ? '✅ Actif' : '❌ Inactif'}`;
        }).join('\n\n');

        embed.addFields(
          { 
            name: `📢 **Salons en Surveillance (${surveillanceChannels.length})**`, 
            value: channelsInfo || 'Aucun salon surveillé', 
            inline: false 
          }
        );
      } else {
        embed.addFields(
          { 
            name: '📢 **Salons en Surveillance**', 
            value: 'Aucun salon surveillé actuellement', 
            inline: false 
          }
        );
      }

      // Configuration
      embed.addFields(
        { 
          name: '⚙️ **Configuration**', 
          value: [
            `**Intervalle de vérification:** ${client.voiceSurveillance.config.checkInterval / 1000}s`,
            `**Délai de reconnexion:** ${client.voiceSurveillance.config.reconnectDelay / 1000}s`,
            `**Log d'activité:** ${client.voiceSurveillance.config.logActivity ? '✅ Activé' : '❌ Désactivé'}`
          ].join('\n'), 
          inline: true 
        }
      );

      // Commandes disponibles
      embed.addFields(
        { 
          name: '🔧 **Commandes Disponibles**', 
          value: [
            '`+joinvoice <channel_id>` - Rejoindre un salon',
            '`+leavevoice <channel_id>` - Quitter un salon',
            '`+voicestatus` - Voir ce statut'
          ].join('\n'), 
          inline: false 
        }
      );

      embed.setFooter({ 
        text: `Demandé par ${message.author.tag} • ${new Date().toLocaleString('fr-FR')}` 
      });

      await message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[VOICE SURVEILLANCE] Error in voicestatus command:', error);
      
      await message.reply({
        content: '❌ **Erreur**\n\nImpossible de récupérer le statut de la surveillance vocale.',
        ephemeral: true
      });
    }
  }
};
