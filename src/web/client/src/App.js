import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [stats, setStats] = useState(null);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, commandsRes] = await Promise.all([
          axios.get('http://localhost:3001/api/stats'),
          axios.get('http://localhost:3001/api/commands')
        ]);
        setStats(statsRes.data);
        setCommands(commandsRes.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement du dashboard...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🎵</span>
          <h1>One Tap Bot</h1>
        </div>
        <p className="subtitle">Dashboard de gestion des salons vocaux temporaires</p>
      </header>

      <main className="main">
        <section className="stats-section">
          <h2>📊 Statistiques</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats?.totalUsers || 0}</div>
              <div className="stat-label">Utilisateurs totaux</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats?.totalGuilds || 0}</div>
              <div className="stat-label">Serveurs</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats?.activeChannels || 0}</div>
              <div className="stat-label">Salons actifs</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{Math.floor((stats?.uptime || 0) / 3600)}h</div>
              <div className="stat-label">Temps de fonctionnement</div>
            </div>
          </div>
        </section>

        <section className="commands-section">
          <h2>⚡ Commandes disponibles</h2>
          <div className="commands-grid">
            {commands.map((command, index) => (
              <div key={index} className="command-card">
                <div className="command-header">
                  <span className="command-name">!{command.name}</span>
                  <span className="command-usage">{command.usage}</span>
                </div>
                <p className="command-description">{command.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="features-section">
          <h2>🚀 Fonctionnalités</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Salons temporaires</h3>
              <p>Création automatique de salons vocaux à la demande</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Gestion avancée</h3>
              <p>Verrouillage, limitation et masquage des salons</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👑</div>
              <h3>Fonctionnalités premium</h3>
              <p>Accès exclusif aux commandes avancées</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Interface moderne</h3>
              <p>Dashboard web responsive et intuitif</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2025 One Tap Bot - Tous droits réservés</p>
      </footer>
    </div>
  );
}

export default App;
