const { errorHandler } = require('../utils/errorHandler');
const { rateLimit } = require('../redisClient');

const prefix = process.env.BOT_PREFIX || '.v';

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    let commandName, args; // Déclarer au niveau de la fonction
    
    try {
      // Early returns pour optimiser les performances
      if (message.author.bot) return;
      if (!message.guild) return; // Ignorer les messages privés
      
      // Vérifier si c'est une commande +taskadd (doit être vérifié avant +task)
      if (message.content.startsWith('+taskadd')) {
        args = message.content.slice(8).trim().split(/\s+/);
        commandName = 'taskadd';
      } else if (message.content.startsWith('+task')) {
        args = message.content.slice(5).trim().split(/\s+/);
        commandName = 'task';
      } else if (message.content.startsWith('+leaderboard') || message.content.startsWith('+lb')) {
        args = message.content.slice(message.content.startsWith('+leaderboard') ? 12 : 3).trim().split(/\s+/);
        commandName = 'leaderboard';
      }
      // Vérifier si c'est une commande avec le préfixe normal
      else if (message.content.startsWith(prefix)) {
        args = message.content.slice(prefix.length).trim().split(/\s+/);
        commandName = args.shift()?.toLowerCase();
      }
      // Si aucun préfixe reconnu, ignorer
      else {
        return;
      }
      
      if (!commandName) return;

      // Lookup de commande optimisé avec cache
      const command = client.commands.prefix.get(commandName);
      if (!command) {
        await errorHandler.logDebug(`Unknown command: ${commandName}`, {
          category: 'command_execution',
          commandName,
          userId: message.author.id,
          guildId: message.guild.id
        });
        return;
      }

      // Rate limiting avec gestion d'erreurs
      const rateLimitKey = `${message.author.id}:${commandName}`;
      const isAllowed = await rateLimit(rateLimitKey, 'command', 5, 60); // 5 commandes par minute
      
      if (!isAllowed) {
        await errorHandler.logInfo(`Rate limit exceeded for user ${message.author.id} on command ${commandName}`, {
          category: 'rate_limit',
          userId: message.author.id,
          commandName,
          guildId: message.guild.id
        });
        
        await message.reply('⚠️ You are using commands too quickly! Please wait a moment.').catch(() => {});
        return;
      }

      // Validation des permissions de base
      if (command.permissions) {
        const member = message.member;
        if (!member.permissions.has(command.permissions)) {
          await errorHandler.logInfo(`Permission denied for user ${message.author.id} on command ${commandName}`, {
            category: 'permissions',
            userId: message.author.id,
            commandName,
            requiredPermissions: command.permissions,
            guildId: message.guild.id
          });
          
          await message.reply('❌ You do not have permission to use this command!').catch(() => {});
          return;
        }
      }

      // Log de l'exécution de commande
      await errorHandler.logInfo(`Executing command: ${commandName}`, {
        category: 'command_execution',
        commandName,
        userId: message.author.id,
        guildId: message.guild.id,
        channelId: message.channel.id,
        args: args.join(' ')
      });

      // Exécution avec timeout et gestion d'erreurs avancée
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Command timeout after 30 seconds')), 30000)
      );
      
      const executionPromise = command.execute(message, args, client);
      
      await Promise.race([executionPromise, timeoutPromise]);
      
      // Log de succès
      await errorHandler.logInfo(`Command executed successfully: ${commandName}`, {
        category: 'command_execution',
        commandName,
        userId: message.author.id,
        guildId: message.guild.id,
        status: 'success'
      });
      
    } catch (error) {
      // Gestion d'erreurs spécifiques
      if (error.message.includes('Command timeout')) {
        await errorHandler.handleError(error, {
          category: 'command_timeout',
          commandName,
          userId: message.author.id,
          guildId: message.guild.id
        });
        
        await message.reply('⚠️ Command took too long to execute! Please try again later.').catch(() => {});
      } else if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('Connect Timeout')) {
        await errorHandler.handleError(error, {
          category: 'connection_timeout',
          commandName,
          userId: message.author.id,
          guildId: message.guild.id
        });
        
        await message.reply('⚠️ Connection timeout! Please try again in a moment.').catch(() => {});
      } else if (error.code === '50013' || error.message.includes('Missing Permissions')) {
        await errorHandler.handleError(error, {
          category: 'bot_permissions',
          commandName,
          userId: message.author.id,
          guildId: message.guild.id
        });
        
        await message.reply('❌ I do not have the required permissions to execute this command!').catch(() => {});
      } else {
        // Erreur générale
        await errorHandler.handleError(error, {
          category: 'command_execution',
          commandName: commandName || 'unknown',
          userId: message.author.id,
          guildId: message.guild.id,
          args: args?.join(' ')
        });
        
        // Message d'erreur générique pour l'utilisateur
        await message.reply('❌ There was an error executing that command! Please try again later.').catch(() => {});
      }
    }
  }
};