const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/etudiants
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, prenom, created_at FROM etudiants ORDER BY nom, prenom`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

// POST /api/etudiants  { nom, prenom? }
router.post('/', async (req, res) => {
  const { nom, prenom } = req.body;
  if (!nom || !nom.trim())
    return res.status(400).json({ error: 'Le nom est requis.' });

  try {
    const result = await pool.query(
      `INSERT INTO etudiants (nom, prenom) VALUES ($1, $2) RETURNING id, nom, prenom`,
      [nom.trim(), (prenom || '').trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

// DELETE /api/etudiants/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM etudiants WHERE id = $1', [req.params.id]);
    res.json({ message: 'Étudiant supprimé', id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

module.exports = router;
