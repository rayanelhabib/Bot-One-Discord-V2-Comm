# Bot-Hosting.net Setup Guide

## Configuration pour bot-hosting.net

Ce bot a été configuré pour fonctionner sur bot-hosting.net sans Redis. Le fichier `bot.js` a été modifié pour désactiver automatiquement Redis.

### Démarrage

**Configuration automatique :**
- **Startup Command :** `npm start` (ou `node src/bot.js`)
- **Main File :** `src/bot.js`

Le bot détecte automatiquement qu'il est sur bot-hosting.net et désactive Redis.

### Variables d'environnement

Le bot fonctionne avec ces variables d'environnement minimales :

```env
DISCORD_TOKEN=your_bot_token_here
BOT_PREFIX=.v
```

### Fonctionnalités disponibles

✅ **Salons vocaux temporaires** - Création automatique de salons  
✅ **Gestion des permissions** - Verrouillage, masquage, etc.  
✅ **Commandes de gestion** - Claim, transfer, etc.  
✅ **Système de tâches** - Gestion des pauses et reprises  
✅ **Leaderboards** - Suivi des performances  

⚠️ **Fonctionnalités limitées sans Redis :**
- Rate limiting désactivé
- Cache en mémoire uniquement
- Pas de persistance des données entre redémarrages

### Dépannage

Si vous rencontrez des erreurs :

1. **Vérifiez que vous utilisez `src/bot.js`**
2. **Assurez-vous que votre token Discord est valide**
3. **Vérifiez les permissions du bot sur votre serveur**

### Support

Pour toute question, consultez les logs du bot ou contactez le support.
