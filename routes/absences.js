const express = require('express');
const router  = express.Router();
const pool    = require('../db');

function maxHeures(dateStr) {
  const dow = new Date(dateStr + 'T12:00:00Z').getUTCDay();
  if (dow >= 0 && dow <= 3) return 7;
  if (dow === 4) return 3;
  return 0;
}

// POST /api/absences  { etudiant_id, date, heures_presentes, heures_absentes }
router.post('/', async (req, res) => {
  const { etudiant_id, date, heures_presentes, heures_absentes } = req.body;
  if (!etudiant_id) return res.status(400).json({ error: 'etudiant_id est requis.' });
  if (!date)        return res.status(400).json({ error: 'date est requis.' });

  const hp  = parseFloat(heures_presentes) || 0;
  const ha  = parseFloat(heures_absentes)  || 0;
  const max = maxHeures(date);

  if (hp < 0 || ha < 0)
    return res.status(400).json({ error: 'Les heures ne peuvent pas être négatives.' });
  if (max === 0)
    return res.status(400).json({ error: 'Ce jour est un week-end, aucune heure à enregistrer.' });
  if (hp + ha > max)
    return res.status(400).json({
      error: `Total (${hp + ha}h) dépasse le maximum autorisé pour ce jour (${max}h).`
    });

  const sql = `
    INSERT INTO absences (etudiant_id, date, heures_presentes, heures_absentes)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (etudiant_id, date) DO UPDATE
      SET heures_presentes = EXCLUDED.heures_presentes,
          heures_absentes  = EXCLUDED.heures_absentes
    RETURNING id, TO_CHAR(date, 'YYYY-MM-DD') AS date, heures_presentes, heures_absentes
  `;
  try {
    const result = await pool.query(sql, [etudiant_id, date, hp, ha]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

// GET /api/absences/:etudiantId/:mois/:annee
router.get('/:etudiantId/:mois/:annee', async (req, res) => {
  const { etudiantId, mois, annee } = req.params;
  const sql = `
    SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, heures_presentes, heures_absentes
    FROM absences
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
