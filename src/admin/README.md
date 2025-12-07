# 🤖 Système d'Administration du Bot

Ce dossier contient toutes les fonctionnalités d'administration du bot OneTab Voice Management.

## 📁 Structure des Fichiers

```
src/admin/
├── README.md              # Ce fichier
├── config.js              # Configuration du bot (URLs, permissions, etc.)
├── mentionHandler.js       # Gestionnaire des mentions du bot
└── (futures fonctionnalités...)
```

## 🚀 Fonctionnalités Implémentées

### 1. **Système de Mention du Bot** (`mentionHandler.js`)

Quand quelqu'un mentionne le bot (@bot), il affiche automatiquement un message informatif avec :

#### **Sections d'Information :**
- **Section Principale** : Description du bot et ses capacités
- **Section Fonctionnalités** : Liste des fonctionnalités clés
- **Section Statistiques** : Stats du bot en temps réel

#### **Boutons d'Action :**
- 🔗 **Invite Bot** - Lien d'invitation avec permissions requises
- 🆘 **Support Server** - Lien vers le serveur de support
- ⚙️ **View Commands** - Liste des commandes disponibles
- 💎 **Premium Features** - Informations sur les fonctionnalités premium

#### **Boutons d'Information :**
- 📊 **Bot Stats** - Statistiques détaillées du bot
- 📱 **GitHub** - Lien vers le repository GitHub
- 💬 **Discord Server** - Lien vers le serveur Discord
- ℹ️ **Quick Help** - Aide rapide pour commencer

#### **Menu de Sélection :**
- 🔧 **Select a feature** - Menu déroulant pour explorer les fonctionnalités

### 2. **Configuration Centralisée** (`config.js`)

Toutes les URLs, permissions et paramètres du bot sont centralisés dans ce fichier :

```javascript
const BOT_CONFIG = {
  INVITE_URL: 'https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot%20applications.commands',
  SUPPORT_SERVER: 'https://discord.gg/YOUR_INVITE_CODE',
  GITHUB_URL: 'https://github.com/your-username/your-repo',
  // ... autres configurations
};
```

## 🎨 Design et Style

Le système utilise les **Discord Components V2** avec le même style que les autres parties du bot :

- **Couleurs Discord** : Bleu primaire, vert succès, rouge danger, etc.
- **Emojis personnalisés** : Utilisation d'emojis serveur et Unicode
- **Thumbnails** : Images haute qualité pour chaque section
- **Layout moderne** : Sections organisées avec TextDisplayBuilder

## 🔧 Comment Utiliser

### **1. Configuration**
Modifiez `src/admin/config.js` pour personnaliser :
- URLs d'invitation
- Serveur de support
- Repository GitHub
- Fonctionnalités premium
- Prix et statistiques

### **2. Test du Système**
1. Mentionnez le bot dans un serveur : `@OneTab Bot`
2. Le bot répondra automatiquement avec le message informatif
3. Cliquez sur les boutons pour tester les interactions

### **3. Personnalisation**
- Modifiez les emojis dans `EMOJIS`
- Changez les couleurs dans `COLORS`
- Ajoutez de nouvelles sections dans `createMentionComponents()`
- Créez de nouveaux gestionnaires d'interaction

## 📋 Fonctionnalités Futures

Ce dossier est conçu pour être extensible. Vous pouvez ajouter :

- **Système de logs d'administration**
- **Commandes de maintenance**
- **Gestion des erreurs avancée**
- **Système de notifications**
- **Outils de diagnostic**
- **Interface de configuration**

## 🛠️ Intégration

Le système est automatiquement intégré dans :
- `src/events/messageCreate.js` - Détection des mentions
- `src/events/interactionCreate.js` - Gestion des interactions

Aucune configuration supplémentaire n'est nécessaire !

## 📝 Notes Importantes

1. **Permissions** : Assurez-vous que le bot a les permissions nécessaires
2. **URLs** : Remplacez les URLs placeholder par vos vraies URLs
3. **Performance** : Le système est optimisé pour les performances
4. **Erreurs** : Gestion d'erreurs robuste avec fallbacks

## 🎯 Exemple d'Utilisation

```javascript
// Le bot détecte automatiquement les mentions
// @OneTab Bot

// Réponse automatique avec composants V2
// [Message informatif avec boutons et sections]

// Interactions utilisateur
// [Clic sur bouton] → [Réponse personnalisée]
```

---

**Développé avec ❤️ pour OneTab Voice Management Bot**
