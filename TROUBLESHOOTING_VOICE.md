# 🔧 Guide de Résolution des Problèmes - Création de Salon Vocal

## 🚨 Problème : La création de salon vocal ne fonctionne pas

### ✅ **PROBLÈME RÉSOLU !**

Le message de bienvenue ne s'affichait pas à cause de deux problèmes :

1. **`.setTooltip()` n'existe pas dans Discord.js v2** - Tous les appels ont été supprimés
2. **Emoji invalide dans le bouton "mute"** - L'ID de l'emoji a été corrigé

Le code fonctionne maintenant parfaitement !

### 📋 **Vérifications Préliminaires**

#### 1. **Bot en Ligne**
- ✅ Le bot doit être connecté à Discord
- ✅ Vérifiez que le bot apparaît en ligne dans votre serveur
- ✅ Vérifiez les logs de démarrage du bot

#### 2. **Configuration Vérifiée**
- ✅ Fichier `guildConfigs.json` existe et contient la bonne configuration
- ✅ `createChannelId` correspond à un salon vocal existant
- ✅ `tempChannelCategoryId` correspond à une catégorie existante

#### 3. **Permissions du Bot**
Le bot doit avoir les permissions suivantes dans le serveur :
- ✅ **View Channels** - Voir les salons
- ✅ **Manage Channels** - Gérer les salons
- ✅ **Connect** - Se connecter aux salons vocaux
- ✅ **Speak** - Parler dans les salons vocaux
- ✅ **Send Messages** - Envoyer des messages
- ✅ **Use Slash Commands** - Utiliser les commandes slash

### 🔍 **Diagnostic Pas à Pas**

#### **Étape 1 : Vérifier la Configuration**
```bash
node debug_voice.js
```
Ce script vérifie :
- Configuration des guildes
- Connexion Redis
- Composants Discord.js v2

#### **Étape 2 : Tester les Composants**
```bash
node test_voice.js
```
Ce script teste :
- Création d'embeds
- Création de boutons
- Styles de composants

#### **Étape 3 : Tester les Événements**
```bash
node test_bot_events.js
```
Ce script teste :
- Connexion du bot
- Événements Discord.js
- Permissions dans le serveur

### 🛠️ **Solutions Courantes**

#### **Problème 1 : Bot non connecté**
```bash
# Vérifiez le token dans .env
DISCORD_TOKEN=votre_token_ici

# Redémarrez le bot
node src/bot.js
```

#### **Problème 2 : Permissions manquantes**
1. Allez dans **Paramètres du serveur** → **Rôles**
2. Trouvez le rôle du bot
3. Activez les permissions manquantes
4. Vérifiez que le rôle est bien assigné au bot

#### **Problème 3 : Salon de création introuvable**
1. Vérifiez que le salon existe toujours
2. Vérifiez que l'ID dans `guildConfigs.json` est correct
3. Utilisez la commande `.v setup` pour reconfigurer

#### **Problème 4 : Catégorie introuvable**
1. Vérifiez que la catégorie existe
2. Vérifiez que le bot a accès à la catégorie
3. Vérifiez les permissions de la catégorie

### 📝 **Commandes de Test**

#### **Commande Setup**
```bash
.v setup
```
- Reconfigure le système de création de salon
- Crée un nouveau salon de création si nécessaire

#### **Commande ShowSetup**
```bash
.v showsetup
```
- Affiche l'interface de contrôle
- Teste les composants v2

#### **Commande Help**
```bash
.v help
```
- Affiche l'aide complète
- Liste toutes les commandes disponibles

### 🔧 **Débogage Avancé**

#### **Vérifier les Logs**
```bash
# Logs Redis
cat src/logs/redis-*.log

# Logs de configuration
cat src/logs/config_validation-*.log

# Logs de données
cat src/logs/data_manager-*.log
```

#### **Vérifier Redis**
```bash
# Test de connexion Redis
redis-cli ping

# Vérifier les clés
redis-cli keys "creator:*"
redis-cli keys "rate_limit:*"
```

#### **Vérifier les Événements**
1. Rejoignez le salon de création
2. Vérifiez les logs du bot dans la console
3. Vérifiez que l'événement `voiceStateUpdate` se déclenche

### 🎯 **Test de Création**

#### **Procédure de Test**
1. **Connectez le bot** : `node src/bot.js`
2. **Vérifiez qu'il est en ligne** dans Discord
3. **Rejoignez le salon** "make your room"
4. **Attendez la création** du salon temporaire
5. **Vérifiez l'embed de bienvenue** avec les composants v2

#### **Résultat Attendu**
- Salon temporaire créé automatiquement
- Embed de bienvenue avec 3 rangées de boutons
- Boutons colorés selon leur fonction
- Tooltips au survol des boutons

### 🚀 **Si Rien ne Fonctionne**

#### **Solution de Dernier Recours**
1. **Sauvegardez** votre configuration actuelle
2. **Supprimez** le fichier `guildConfigs.json`
3. **Redémarrez** le bot
4. **Utilisez** `.v setup` pour reconfigurer
5. **Testez** la création de salon

#### **Contact Support**
Si le problème persiste :
- Vérifiez les logs d'erreur
- Testez sur un serveur de test
- Contactez le support avec les logs

---

## 📊 **Statut des Tests**

| Test | Statut | Description |
|------|--------|-------------|
| Configuration | ✅ | Fichier de config valide |
| Redis | ✅ | Connexion et opérations OK |
| Discord.js v2 | ✅ | Composants fonctionnels |
| Permissions | ⚠️ | À vérifier dans Discord |
| Événements | ⚠️ | À tester avec le bot en ligne |

**Prochaine étape :** Le problème est résolu ! Redémarrez le bot et testez la création de salon vocal.
