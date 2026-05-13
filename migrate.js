require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Table étudiants
    await client.query(`
      CREATE TABLE IF NOT EXISTS etudiants (
        id         SERIAL PRIMARY KEY,
        nom        VARCHAR(100) NOT NULL,
        prenom     VARCHAR(100) DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 2. Colonne etudiant_id dans absences (nullable pour migration)
    await client.query(`
      ALTER TABLE absences
        ADD COLUMN IF NOT EXISTS etudiant_id INTEGER REFERENCES etudiants(id) ON DELETE CASCADE
    `);

    // 3. Colonne etudiant_id dans jours_libres
    await client.query(`
      ALTER TABLE jours_libres
        ADD COLUMN IF NOT EXISTS etudiant_id INTEGER REFERENCES etudiants(id) ON DELETE CASCADE
    `);

    // 4. Si des données existantes sans etudiant_id → créer un étudiant par défaut
    const orphans = await client.query(
      `SELECT COUNT(*) FROM absences WHERE etudiant_id IS NULL`
    );
    if (parseInt(orphans.rows[0].count) > 0) {
      const def = await client.query(
        `INSERT INTO etudiants (nom, prenom) VALUES ('Étudiant', 'Par défaut') RETURNING id`
      );
      const defId = def.rows[0].id;
      await client.query(`UPDATE absences    SET etudiant_id = $1 WHERE etudiant_id IS NULL`, [defId]);
      await client.query(`UPDATE jours_libres SET etudiant_id = $1 WHERE etudiant_id IS NULL`, [defId]);
      console.log(`Données existantes migrées vers l'étudiant id=${defId}`);
    }

    // 5. Remplacer les contraintes UNIQUE simples par des contraintes composites
    await client.query(`ALTER TABLE absences     DROP CONSTRAINT IF EXISTS absences_date_key`);
    await client.query(`ALTER TABLE jours_libres DROP CONSTRAINT IF EXISTS jours_libres_date_key`);

    await client.query(`
      ALTER TABLE absences
        ADD CONSTRAINT IF NOT EXISTS absences_etudiant_date_uq UNIQUE (etudiant_id, date)
    `).catch(() => {}); // ignore si déjà existante

    await client.query(`
      ALTER TABLE jours_libres
        ADD CONSTRAINT IF NOT EXISTS jours_libres_etudiant_date_uq UNIQUE (etudiant_id, date)
    `).catch(() => {});

    await client.query('COMMIT');
    console.log('Migration terminée avec succès.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur migration :', err.message);
  } finally {
    client.release();
    await pool.end();
  }
})();
