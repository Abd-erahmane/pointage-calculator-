const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// POST /api/jours-libres  { etudiant_id, date, motif? }
router.post('/', async (req, res) => {
  const { etudiant_id, date, motif } = req.body;
  if (!etudiant_id) return res.status(400).json({ error: 'etudiant_id est requis.' });
  if (!date)        return res.status(400).json({ error: 'date est requis.' });

  const sql = `
    INSERT INTO jours_libres (etudiant_id, date, motif)
    VALUES ($1, $2, $3)
    ON CONFLICT (etudiant_id, date) DO UPDATE SET motif = EXCLUDED.motif
    RETURNING id, TO_CHAR(date, 'YYYY-MM-DD') AS date, motif
  `;
  try {
    const result = await pool.query(sql, [etudiant_id, date, motif || null]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

// DELETE /api/jours-libres/:etudiantId/:date
router.delete('/:etudiantId/:date', async (req, res) => {
  const { etudiantId, date } = req.params;
  try {
    await pool.query(
      'DELETE FROM jours_libres WHERE etudiant_id = $1 AND date = $2',
      [etudiantId, date]
    );
    res.json({ message: 'Supprimé', date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

// GET /api/jours-libres/:etudiantId/:mois/:annee
router.get('/:etudiantId/:mois/:annee', async (req, res) => {
  const { etudiantId, mois, annee } = req.params;
  const sql = `
    SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, motif
    FROM jours_libres
    WHERE etudiant_id = $1
      AND EXTRACT(MONTH FROM date) = $2
      AND EXTRACT(YEAR  FROM date) = $3
    ORDER BY date
  `;
  try {
    const result = await pool.query(sql, [etudiantId, parseInt(mois), parseInt(annee)]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

module.exports = router;
