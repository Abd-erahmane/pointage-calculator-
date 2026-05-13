require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const etudiantsRouter   = require('./routes/etudiants');
const absencesRouter    = require('./routes/absences');
const joursLibresRouter = require('./routes/joursLibres');
const statsRouter       = require('./routes/stats');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/etudiants',    etudiantsRouter);
app.use('/api/absences',     absencesRouter);
app.use('/api/jours-libres', joursLibresRouter);
app.use('/api/stats',        statsRouter);

// Fallback SPA — sert index.html pour toutes les routes non-API
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage local uniquement (pas sur Vercel qui gère le serveur lui-même)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

// Export pour Vercel (serverless)
module.exports = app;
