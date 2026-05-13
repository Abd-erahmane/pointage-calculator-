require('dotenv').config();
const { Pool } = require('pg');

const CONNECTION = process.env.DATABASE_URL
  || 'postgresql://postgres:Aa12345%40%40@127.0.0.1:5000/comptage';

const pool = new Pool({ connectionString: CONNECTION });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
