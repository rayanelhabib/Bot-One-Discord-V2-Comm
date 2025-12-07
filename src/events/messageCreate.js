const { Events, MessageFlags } = require('discord.js');
const { createMentionComponents, handleMentionInteraction } = require('../admin/mentionHandler');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignorer les messages du bot lui-même
    if (message.author.bot) return;
    
    // Gestion des commandes sans préfixe (surveillance vocale)
    const args = message.content.trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Commandes de surveillance vocale sans préfixe
    const voiceCommands = ['joinvoice', 'jv', 'joinvc', 'leavevoice', 'lv', 'leavevc', 'voicestatus', 'vs', 'voicestat'];
    
    if (voiceCommands.includes(commandName)) {
      const command = message.client.commands.prefix.get(commandName) || 
                     message.client.commands.prefix.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
      
      if (command) {
        try {
          console.log(`[VOICE COMMAND] ${message.author.tag} used command: ${commandName} -> ${command.name}`);
          await command.execute(message, args, message.client);
        } catch (error) {
          console.error(`[VOICE COMMAND] Error executing command ${commandName}:`, error);
          await message.reply({
            content: '❌ **Erreur**\n\nUne erreur est survenue lors de l\'exécution de cette commande.',
            ephemeral: true
          });
        }
        return;
      }
    }
    
    // Gestion des commandes avec préfixe (autres commandes)
    const prefix = process.env.BOT_PREFIX || '+';
    
    if (message.content.startsWith(prefix)) {
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();
      
      // Recherche directe par nom
      let command = message.client.commands.prefix.get(commandName);
      
      // Si pas trouvé, recherche par alias
      if (!command) {
        command = message.client.commands.prefix.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
      }
      
      if (command) {
        try {
          console.log(`[COMMAND] ${message.author.tag} used command: ${commandName} -> ${command.name}`);
          await command.execute(message, args, message.client);
        } catch (error) {
          console.error(`[COMMAND] Error executing command ${commandName}:`, error);
          await message.reply({
            content: '❌ **Erreur**\n\nUne erreur est survenue lors de l\'exécution de cette commande.',
            ephemeral: true
          });
        }
        return;
      } else {
        // Répondre que la commande n'existe pas
        await message.reply({
          content: `❌ **Commande inconnue**\n\nLa commande \`${prefix}${commandName}\` n'existe pas.\n\nUtilisez \`${prefix}help\` pour voir toutes les commandes disponibles.`,
          ephemeral: true
        });
      }
    }
    
    // Vérifier si le bot est mentionné dans le message
    const botMentioned = message.mentions.has(message.client.user);
    
    if (botMentioned) {
      try {
        console.log(`[MENTION] Bot mentioned by ${message.author.tag} in ${message.guild?.name || 'DM'}`);
        
        // Créer les composants V2 pour la mention
        const mentionData = createMentionComponents(message.client, message.guild);
        
        // Envoyer un message privé à la personne qui a mentionné le bot
        try {
          await message.author.send({
            content: `🤖 **OneTab Voice Management Bot**\n\nThanks for mentioning me! Here's what I can do for you:`,
            components: mentionData.components,
            files: mentionData.files,
            flags: MessageFlags.IsComponentsV2
          });
          
          // Confirmer en public que le message a été envoyé en privé
          await message.reply({
            content: `✅ ${message.author}, I've sent you a private message with all the information about me!`,
            ephemeral: false
          });
        } catch (dmError) {
          // Si on ne peut pas envoyer de MP, répondre publiquement
          console.log(`[MENTION] Cannot send DM to ${message.author.tag}, responding publicly`);
          await message.reply({
            components: mentionData.components,
            files: mentionData.files,
            flags: MessageFlags.IsComponentsV2
          });
        }
        
        // Log pour le dashboard si disponible
        if (global.addBotLog) {
          global.addBotLog('info', `Bot mentioned by ${message.author.tag} in ${message.guild?.name || 'DM'}`);
        }
        
      } catch (error) {
        console.error('[MENTION] Error handling bot mention:', error);
        
        // Fallback en cas d'erreur avec les composants V2
        await message.reply({
          content: `🤖 **OneTab Voice Management Bot**\n\nThanks for mentioning me! I'm a professional voice channel management bot.\n\n**Quick Commands:**\n• \`+setup\` - Setup voice channels\n• \`+help\` - View all commands\n• \`+status\` - Check bot status\n\n**Need Help?** Join our support server or use \`+help\` for more information!`
        });
      }
    }
  }
};