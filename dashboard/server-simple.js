const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour l'encodage UTF-8
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});

// Route principale
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Accueil - Soran Dashboard',
        currentPage: 'home'
    });
});

// Route des commandes
app.get('/commands', (req, res) => {
    res.render('commands', {
        title: 'Commandes - Soran Dashboard',
        currentPage: 'commands'
    });
});

// Route à propos
app.get('/about', (req, res) => {
    res.render('about', {
        title: 'À propos - Soran Dashboard',
        currentPage: 'about'
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Dashboard Soran démarré sur le port ${PORT}`);
    console.log(`📊 Interface: http://localhost:${PORT}`);
});
