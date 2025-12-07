const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'trash',
  description: '🗑️ Nettoyer tous les messages du salon vocal temporaire',
  usage: '.v trash',
  category: 'voice',
  permissions: [PermissionFlagsBits.ManageChannels],
  
  async execute(message, args) {
    try {
      const member = message.member;
      const voiceChannel = member.voice.channel;
      
      if (!voiceChannel) {
        return message.reply('❌ Vous devez être dans un salon vocal pour utiliser cette commande.');
      }
      
      // Vérifier si c'est un salon temporaire créé par le bot
      const { safeGet } = require('../../redisClient');
      const creatorId = await safeGet(`creator:${voiceChannel.id}`).catch(() => null);
      
      if (!creatorId) {
        return message.reply('❌ Cette commande ne peut être utilisée que dans un salon temporaire créé par le bot.');
      }
      
      // Vérifier si l'utilisateur est le créateur du salon
      if (creatorId !== member.id) {
        return message.reply('❌ Seul le créateur du salon peut utiliser cette commande.');
      }
      
      // Confirmation avec embed
      const confirmEmbed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('🗑️ Confirmation de nettoyage')
        .setDescription(`Êtes-vous sûr de vouloir supprimer **tous les messages** du salon \`${voiceChannel.name}\` ?\n\n⚠️ **Cette action est irréversible !**`)
        .addFields(
          { name: '📊 Messages à supprimer', value: 'Tous les messages récents (derniers 100)', inline: true },
          { name: '⏱️ Temps estimé', value: '5-10 secondes', inline: true },
          { name: '🔒 Sécurité', value: 'Seul le créateur peut confirmer', inline: true }
        )
        .setFooter({ text: 'Réagissez avec ✅ pour confirmer ou ❌ pour annuler' })
        .setTimestamp();
      
      const confirmMessage = await message.reply({ embeds: [confirmEmbed] });
      
      // Ajouter les réactions
      await confirmMessage.react('✅');
      await confirmMessage.react('❌');
      
      // Collecteur de réactions
      const filter = (reaction, user) => {
        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === member.id;
      };
      
      const collector = confirmMessage.createReactionCollector({ 
        filter, 
        time: 30000, 
        max: 1 
      });
      
      collector.on('collect', async (reaction) => {
        if (reaction.emoji.name === '✅') {
          // Confirmation - procéder au nettoyage
          const processingEmbed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('🔄 Nettoyage en cours...')
            .setDescription('Suppression des messages en cours, veuillez patienter...')
            .setTimestamp();
          
          await confirmMessage.edit({ embeds: [processingEmbed] });
          
          try {
            // Nettoyer les messages
            const messages = await voiceChannel.messages.fetch({ limit: 100 });
            let deletedCount = 0;
            
            if (messages.size > 0) {
              // Supprimer par batch de 10
              const messageArray = Array.from(messages.values());
              for (let i = 0; i < messageArray.length; i += 10) {
                const batch = messageArray.slice(i, i + 10);
                try {
                  await voiceChannel.bulkDelete(batch, true);
                  deletedCount += batch.length;
                } catch (error) {
                  // Si bulk delete échoue, supprimer individuellement
                  for (const msg of batch) {
                    try {
                      await msg.delete();
                      deletedCount++;
                    } catch (deleteError) {
                      // Ignorer les erreurs de suppression individuelle
                    }
                  }
                }
                
                // Petite pause entre les batches
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            // Message de succès
            const successEmbed = new EmbedBuilder()
              .setColor('#00ff00')
              .setTitle('✅ Nettoyage terminé')
              .setDescription(`**${deletedCount} messages** ont été supprimés du salon \`${voiceChannel.name}\``)
              .addFields(
                { name: '🗑️ Messages supprimés', value: deletedCount.toString(), inline: true },
                { name: '⏱️ Temps écoulé', value: 'Quelques secondes', inline: true },
                { name: '🔒 Sécurité', value: 'Nettoyage sécurisé', inline: true }
              )
              .setTimestamp();
            
            await confirmMessage.edit({ embeds: [successEmbed] });
            
            // Supprimer les réactions
            try {
              await confirmMessage.reactions.removeAll();
            } catch (error) {
              // Ignorer les erreurs de suppression des réactions
            }
            
          } catch (error) {
            console.error('[TRASH] Erreur lors du nettoyage:', error);
            
            const errorEmbed = new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle('❌ Erreur lors du nettoyage')
              .setDescription('Une erreur est survenue lors de la suppression des messages.')
              .addFields(
                { name: '🔍 Détails', value: error.message || 'Erreur inconnue', inline: false }
              )
              .setTimestamp();
            
            await confirmMessage.edit({ embeds: [errorEmbed] });
          }
          
        } else if (reaction.emoji.name === '❌') {
          // Annulation
          const cancelEmbed = new EmbedBuilder()
            .setColor('#808080')
            .setTitle('❌ Nettoyage annulé')
            .setDescription('Le nettoyage des messages a été annulé.')
            .setTimestamp();
          
          await confirmMessage.edit({ embeds: [cancelEmbed] });
          
          // Supprimer les réactions
          try {
            await confirmMessage.reactions.removeAll();
          } catch (error) {
            // Ignorer les erreurs de suppression des réactions
          }
        }
      });
      
      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          // Timeout
          const timeoutEmbed = new EmbedBuilder()
            .setColor('#808080')
            .setTitle('⏰ Temps écoulé')
            .setDescription('Le temps de confirmation a expiré. Le nettoyage a été annulé.')
            .setTimestamp();
          
          await confirmMessage.edit({ embeds: [timeoutEmbed] });
          
          // Supprimer les réactions
          try {
            await confirmMessage.reactions.removeAll();
          } catch (error) {
            // Ignorer les erreurs de suppression des réactions
          }
        }
      });
      
    } catch (error) {
      console.error('[TRASH] Erreur commande trash:', error);
      message.reply('❌ Une erreur est survenue lors de l\'exécution de la commande.');
    }
  }
};

