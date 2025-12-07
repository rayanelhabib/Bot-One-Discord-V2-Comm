const { MessageFlags } = require('discord.js');
const { sendExampleMessage } = require('../../examples/discord-components-v2-examples');

module.exports = {
  name: 'components-v2-example',
  description: 'Exemple complet de Discord Components v2 avec conteneurs, sélections et thumbnails',
  usage: '.v components-v2-example',
  
  async execute(message, args, client) {
    try {
      // Envoyer l'exemple complet
      await sendExampleMessage(message);
      
      // Message de confirmation
      await message.reply({
        content: '✅ **Exemple Discord Components v2 envoyé !**\n\n' +
                'Ce message montre tous les exemples de conteneurs avec sélections et thumbnails multiples.\n\n' +
                '**Fonctionnalités démontrées :**\n' +
                '• Conteneurs avec plusieurs thumbnails\n' +
                '• Sélection de canaux vocaux\n' +
                '• Sélection de rôles\n' +
                '• Sélection d\'utilisateurs\n' +
                '• Sélection multiple (mentionable)\n' +
                '• Menu de sélection de chaînes\n' +
                '• Galerie de thumbnails\n' +
                '• Mise en page avancée avec sections\n\n' +
                '**Note :** Les Discord Components v2 ne supportent pas les boutons interactifs, mais les menus de sélection fonctionnent normalement.',
        flags: MessageFlags.SuppressEmbeds
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'exemple Discord Components v2:', error);
      
      await message.reply({
        content: '❌ **Erreur lors de l\'envoi de l\'exemple**\n\n' +
                'Une erreur s\'est produite lors de la création de l\'exemple Discord Components v2.\n' +
                'Vérifiez les logs pour plus de détails.',
        flags: MessageFlags.SuppressEmbeds
      });
    }
  }
};
