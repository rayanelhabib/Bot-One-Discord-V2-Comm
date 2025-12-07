const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3001;

// Configuration de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression et performance
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});
app.use(limiter);

// CORS
app.use(cors());

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', require('ejs').renderFile);

// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d', // Cache pour 1 jour
  etag: true
}));

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware pour l'encodage UTF-8
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Route de test
app.get('/test', (req, res) => {
    res.render('test', { title: 'Test EJS - Soran Dashboard' });
});

// Routes
app.use('/', require('./routes/index'));
app.use('/commands', require('./routes/commands'));
app.use('/api', require('./routes/api'));

// Route 404
app.use('*', (req, res) => {
  res.status(404).render('404', {
    title: 'Page non trouvée - Soran Dashboard',
    currentPage: '404'
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).render('error', {
    title: 'Erreur serveur - Soran Dashboard',
    error: process.env.NODE_ENV === 'development' ? err : {},
    currentPage: 'error'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Dashboard Soran démarré sur le port ${PORT}`);
  console.log(`📊 Interface: http://localhost:${PORT}`);
  console.log(`⚡ Mode: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;