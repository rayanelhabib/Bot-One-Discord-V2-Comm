# One Tap Bot - Discord Temporary Voice Channels

Un bot Discord moderne pour créer des salons vocaux temporaires avec gestion Redis et fonctionnalités premium.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ 
- Redis (optionnel, utilise les valeurs par défaut si non configuré)
- Token Discord Bot

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd one_tap_simple_bot-main
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
# Copier le fichier .env.example ou créer un .env
cp .env.example .env
```

4. **Éditer le fichier .env**
```env
DISCORD_TOKEN=votre_token_discord_ici
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
NODE_ENV=production
LOG_LEVEL=info
```

5. **Démarrer le bot**
```bash
npm start
```

## 📁 Structure du Projet

```
📁 one_tap_simple_bot-main/
├── 📄 package.json          # Dépendances et scripts
├── 📄 .env                  # Configuration (à créer)
├── 📄 src/bot.js           # Point d'entrée principal
├── 📁 src/commands/        # Commandes du bot
│   ├── 📁 prefix/          # Commandes avec préfixe
│   └── 📁 slash/           # Commandes slash
├── 📁 src/events/          # Événements Discord
├── 📁 src/utils/           # Utilitaires
├── 📁 src/data/            # Données persistantes
└── 📁 src/logs/            # Logs du bot
```

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Requis | Défaut |
|----------|-------------|--------|--------|
| `DISCORD_TOKEN` | Token de votre bot Discord | ✅ | - |
| `REDIS_HOST` | Hôte Redis | ❌ | localhost |
| `REDIS_PORT` | Port Redis | ❌ | 6379 |
| `REDIS_PASSWORD` | Mot de passe Redis | ❌ | - |
| `REDIS_DB` | Base de données Redis | ❌ | 0 |
| `NODE_ENV` | Environnement | ❌ | production |
| `LOG_LEVEL` | Niveau de log | ❌ | info |

## 🎮 Commandes

### Commandes avec préfixe
- `+task setup` - Configurer le bot
- `+task claim` - Réclamer un salon vocal
- `+task lock` - Verrouiller un salon
- `+task unlock` - Déverrouiller un salon
- `+task limit` - Limiter les utilisateurs
- `+task hide` - Cacher le salon
- `+task show` - Afficher le salon

### Commandes slash
- `/setup` - Configuration interactive

## 🚀 Déploiement

### Bot-hosting.net
1. Importer les fichiers : `package.json`, `.env`, et tout le dossier `src/`
2. Configurer le point d'entrée : `src/bot.js`
3. Commande de démarrage : `npm start`
4. Configurer les variables d'environnement dans l'interface

### Docker
```bash
docker-compose up -d
```

## 🔧 Scripts Disponibles

- `npm start` - Démarrer le bot
- `npm run dev` - Mode développement avec nodemon
- `npm run check` - Vérifier la configuration
- `npm test` - Tests
- `npm run lint` - Vérification du code
- `npm run format` - Formatage du code

## 📊 Fonctionnalités

- ✅ Salons vocaux temporaires automatiques
- ✅ Gestion des permissions avancée
- ✅ Système de whitelist/blacklist
- ✅ Limitation d'utilisateurs
- ✅ Verrouillage/déverrouillage
- ✅ Système premium
- ✅ Logs détaillés
- ✅ Gestion d'erreurs robuste
- ✅ Support multi-serveurs

## 🛠️ Développement

### Structure des commandes
Chaque commande doit avoir :
```javascript
module.exports = {
  name: 'nom_commande',
  description: 'Description',
  execute: async (message, args, client) => {
    // Logique de la commande
  }
};
```

### Structure des événements
```javascript
module.exports = {
  name: 'eventName',
  once: false, // ou true pour once
  execute: async (eventArgs, client) => {
    // Logique de l'événement
  }
};
```

## 📝 Logs

Les logs sont automatiquement créés dans `src/logs/` avec rotation quotidienne :
- `command_execution-YYYY-MM-DD.log`
- `config_validation-YYYY-MM-DD.log`
- `data_manager-YYYY-MM-DD.log`
- `redis_health-YYYY-MM-DD.log`

## 🤝 Support

Pour toute question ou problème :
1. Vérifiez les logs dans `src/logs/`
2. Utilisez `npm run check` pour diagnostiquer
3. Consultez la documentation des commandes

## 📄 Licence

Ce projet est sous licence MIT. 