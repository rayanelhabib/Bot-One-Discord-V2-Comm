# 🎵 Soran Dashboard

Dashboard moderne et performant pour le bot Discord Soran - Gestion avancée des salons vocaux temporaires.

## ✨ Fonctionnalités

- **Interface Moderne** : Design responsive avec animations fluides et effets 3D
- **Thèmes Multiples** : 4 thèmes disponibles (Sombre, Clair, Néon, Océan)
- **Performance Optimisée** : Chargement rapide et interactions fluides
- **Responsive Design** : Compatible mobile, tablette et desktop
- **Animations Avancées** : Effets visuels modernes et transitions fluides
- **API Intégrée** : Endpoints pour les statistiques et données du bot
- **Sécurité** : Protection contre les attaques et rate limiting

## 🚀 Installation

### Prérequis

- Node.js 16+ 
- npm ou yarn
- Bot Discord Soran configuré

### Installation des dépendances

```bash
cd dashboard
npm install
```

### Configuration

1. Copiez le fichier `.env.example` vers `.env` :
```bash
cp .env.example .env
```

2. Configurez les variables d'environnement dans `.env` :
```env
DASHBOARD_PORT=3000
NODE_ENV=development
```

### Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

Le dashboard sera accessible sur `http://localhost:3000`

## 📁 Structure du Projet

```
dashboard/
├── public/                 # Fichiers statiques
│   ├── css/               # Styles CSS
│   │   ├── main.css       # Styles principaux
│   │   ├── components.css # Composants UI
│   │   └── animations.css # Animations
│   ├── js/                # JavaScript
│   │   ├── main.js        # Script principal
│   │   ├── theme.js       # Gestion des thèmes
│   │   └── animations.js  # Gestion des animations
│   └── images/            # Images et assets
├── routes/                # Routes Express
│   ├── index.js          # Route principale
│   ├── commands.js       # Route des commandes
│   └── api.js            # API endpoints
├── views/                 # Templates EJS
│   ├── layout.ejs        # Layout principal
│   ├── index.ejs         # Page d'accueil
│   ├── commands.ejs      # Page des commandes
│   └── about.ejs         # Page à propos
├── server.js             # Serveur Express
├── package.json          # Dépendances
└── README.md            # Documentation
```

## 🎨 Thèmes Disponibles

### Thème Sombre (Par défaut)
- Couleurs principales : Vert (#00ff88) et Violet (#6366f1)
- Fond sombre pour un confort visuel optimal
- Parfait pour une utilisation prolongée

### Thème Clair
- Couleurs adaptées pour la lumière du jour
- Contraste optimisé pour la lisibilité
- Interface épurée et professionnelle

### Thème Néon
- Couleurs vives et flashy
- Effets de glow et animations
- Parfait pour un look futuriste

### Thème Océan
- Palette de couleurs bleues et turquoise
- Ambiance apaisante et moderne
- Inspiré des profondeurs marines

## 🔧 Personnalisation

### Ajouter un nouveau thème

1. Modifiez le fichier `public/js/theme.js`
2. Ajoutez votre thème dans l'objet `themes`
3. Définissez les couleurs CSS personnalisées

```javascript
const customTheme = {
    name: 'Mon Thème',
    icon: 'star',
    colors: {
        '--primary-color': '#votre-couleur',
        // ... autres couleurs
    }
};
```

### Modifier les animations

1. Éditez `public/css/animations.css` pour les styles
2. Modifiez `public/js/animations.js` pour la logique
3. Utilisez les classes d'animation dans vos templates

## 📊 API Endpoints

### Statistiques du Bot
```
GET /api/stats
```

### Performances
```
GET /api/performance
```

### Serveurs
```
GET /api/servers
```

### Logs
```
GET /api/logs
```

### Santé du Système
```
GET /api/health
```

## 🎯 Utilisation

### Navigation
- **Accueil** : Vue d'ensemble et statistiques
- **Commandes** : Liste complète des commandes avec recherche
- **À propos** : Informations sur Soran et l'équipe

### Fonctionnalités Interactives
- **Recherche** : Recherchez des commandes par nom ou description
- **Filtres** : Filtrez les commandes par catégorie
- **Copie** : Copiez les commandes d'un clic
- **Thèmes** : Changez de thème en temps réel

### Raccourcis Clavier
- `Ctrl/Cmd + K` : Ouvrir la recherche
- `Escape` : Fermer les modales
- `T` : Basculer le thème

## 🚀 Déploiement

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Heroku
```bash
git add .
git commit -m "Deploy dashboard"
git push heroku main
```

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Sécurité

- **Helmet.js** : Protection des en-têtes HTTP
- **Rate Limiting** : Limitation des requêtes par IP
- **CORS** : Configuration des origines autorisées
- **Validation** : Validation des entrées utilisateur
- **Sanitisation** : Nettoyage des données

## 📱 Responsive Design

Le dashboard s'adapte automatiquement à tous les écrans :
- **Mobile** : < 768px
- **Tablette** : 768px - 1024px
- **Desktop** : > 1024px

## 🎨 Personnalisation Avancée

### Variables CSS
Modifiez les variables dans `public/css/main.css` :

```css
:root {
    --primary-color: #votre-couleur;
    --secondary-color: #votre-couleur;
    /* ... autres variables */
}
```

### Animations Personnalisées
Ajoutez vos animations dans `public/css/animations.css` :

```css
@keyframes monAnimation {
    0% { transform: scale(1); }
    100% { transform: scale(1.1); }
}

.mon-element {
    animation: monAnimation 1s ease infinite;
}
```

## 🐛 Dépannage

### Problèmes Courants

1. **Port déjà utilisé** : Changez le port dans `.env`
2. **Erreurs EJS** : Vérifiez la syntaxe des templates
3. **CSS non chargé** : Vérifiez les chemins des fichiers statiques
4. **JavaScript non fonctionnel** : Ouvrez la console pour voir les erreurs

### Logs
Les logs sont disponibles dans la console du navigateur et les logs serveur.

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Contactez l'équipe sur Discord
- Consultez la documentation

---

**Soran Dashboard** - Fait avec ❤️ pour la communauté Discord
