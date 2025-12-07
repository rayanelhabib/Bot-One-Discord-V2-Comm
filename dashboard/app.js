const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route principale
app.get('/', (req, res) => {
    res.render('basic', {
        title: 'Accueil - Soran Dashboard',
        currentPage: 'home'
    });
});

// Route de test
app.get('/test', (req, res) => {
    res.render('test', { title: 'Test EJS - Soran Dashboard' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Dashboard Soran démarré sur le port ${PORT}`);
    console.log(`📊 Interface: http://localhost:${PORT}`);
    console.log(`🧪 Test: http://localhost:${PORT}/test`);
});
