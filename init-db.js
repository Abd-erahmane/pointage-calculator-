require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const sql = fs.readFileSync('./schema.sql', 'utf8');
    await pool.query(sql);
    console.log('Tables créées avec succès.');
  } catch (err) {
    console.error('Erreur init DB :', err.message);
  } finally {
    await pool.end();
  }
})();
