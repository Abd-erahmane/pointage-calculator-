const express = require('express');
const router  = express.Router();
const pool    = require('../db');

function getTheoreticalHoursForDay(dateObj) {
  const day = dateObj.getUTCDay();
  if (day >= 0 && day <= 3) return 7;
  if (day === 4) return 3;
  return 0;
}

// GET /api/stats/:etudiantId/:mois/:annee
router.get('/:etudiantId/:mois/:annee', async (req, res) => {
  const etudiantId = parseInt(req.params.etudiantId);
  const mois       = parseInt(req.params.mois);
  const annee      = parseInt(req.params.annee);

  try {
    // 1. Jours libres de cet étudiant pour ce mois
    const jlRes = await pool.query(
      `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date FROM jours_libres
       WHERE etudiant_id = $1
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR  FROM date) = $3`,
      [etudiantId, mois, annee]
    );
    const joursLibresSet = new Set(jlRes.rows.map(r => r.date));

    // 2. Calcul des heures théoriques du mois
    let theoreticalHours = 0;
    const daysInMonth = new Date(Date.UTC(annee, mois, 0)).getUTCDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(Date.UTC(annee, mois - 1, d, 12, 0, 0));
      const isoStr  = dateObj.toISOString().slice(0, 10);
      if (!joursLibresSet.has(isoStr)) {
        theoreticalHours += getTheoreticalHoursForDay(dateObj);
      }
    }

    // 3. Somme des absences/présences de cet étudiant
    const absRes = await pool.query(
      `SELECT
         COALESCE(SUM(heures_absentes),  0)::float AS total_absent,
         COALESCE(SUM(heures_presentes), 0)::float AS total_present
       FROM absences
       WHERE etudiant_id = $1
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR  FROM date) = $3`,
      [etudiantId, mois, annee]
    );

    const totalAbsent  = parseFloat(absRes.rows[0].total_absent);
    const totalPresent = parseFloat(absRes.rows[0].total_present);

    const percentage = theoreticalHours > 0
      ? Math.round((totalAbsent / theoreticalHours) * 10000) / 100
      : 0;

    res.json({
      etudiantId, mois, annee,
      theoreticalHours, totalAbsent, totalPresent,
      percentage,
      alert: percentage > 20,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

module.exports = router;
