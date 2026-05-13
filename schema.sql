CREATE TABLE IF NOT EXISTS absences (
  id               SERIAL PRIMARY KEY,
  date             DATE UNIQUE NOT NULL,
  heures_presentes DECIMAL(4,2) DEFAULT 0,
  heures_absentes  DECIMAL(4,2) DEFAULT 0,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jours_libres (
  id         SERIAL PRIMARY KEY,
  date       DATE UNIQUE NOT NULL,
  motif      VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
