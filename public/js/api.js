const api = (() => {
  const BASE = '/api';

  async function request(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  }

  return {
    // ── Étudiants ──────────────────────────────────────────────
    getEtudiants() {
      return request(`${BASE}/etudiants`);
    },
    addEtudiant(nom, prenom = '') {
      return request(`${BASE}/etudiants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, prenom }),
      });
    },
    deleteEtudiant(id) {
      return request(`${BASE}/etudiants/${id}`, { method: 'DELETE' });
    },

    // ── Absences ───────────────────────────────────────────────
    upsertAbsence(etudiantId, date, heures_presentes, heures_absentes) {
      return request(`${BASE}/absences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etudiant_id: etudiantId, date, heures_presentes, heures_absentes }),
      });
    },
    getAbsences(etudiantId, mois, annee) {
      return request(`${BASE}/absences/${etudiantId}/${mois}/${annee}`);
    },

    // ── Jours libres ───────────────────────────────────────────
    addJourLibre(etudiantId, date, motif = '') {
      return request(`${BASE}/jours-libres`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etudiant_id: etudiantId, date, motif }),
      });
    },
    removeJourLibre(etudiantId, date) {
      return request(`${BASE}/jours-libres/${etudiantId}/${date}`, { method: 'DELETE' });
    },
    getJoursLibres(etudiantId, mois, annee) {
      return request(`${BASE}/jours-libres/${etudiantId}/${mois}/${annee}`);
    },

    // ── Stats ──────────────────────────────────────────────────
    getStats(etudiantId, mois, annee) {
      return request(`${BASE}/stats/${etudiantId}/${mois}/${annee}`);
    },
  };
})();
