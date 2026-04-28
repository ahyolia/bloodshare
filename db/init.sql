-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  pseudo VARCHAR(100),
  avatar_url VARCHAR(255),
  groupe_sanguin VARCHAR(5),
  date_naissance DATE,
  genre VARCHAR(20),
  region VARCHAR(100),
  xp_total INT DEFAULT 0,
  code_parrainage VARCHAR(20) UNIQUE,
  notif_push BOOLEAN DEFAULT true,
  notif_email BOOLEAN DEFAULT true,
  notif_stock_urgences BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Slots (créneaux)
CREATE TABLE IF NOT EXISTS slots (
  id SERIAL PRIMARY KEY,
  centre_id INT,
  date_heure TIMESTAMP NOT NULL,
  duree_minutes INT DEFAULT 15,
  capacite_max INT DEFAULT 2,
  nb_reserves INT DEFAULT 0,
  statut VARCHAR(20) DEFAULT 'disponible'
);

-- Appointments (rendez-vous)
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  slot_id INT REFERENCES slots(id),
  date_reservation TIMESTAMP DEFAULT NOW(),
  statut VARCHAR(20) DEFAULT 'réservé'
);

-- Donations (dons validés)
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  centre_id INT,
  type_don VARCHAR(50),
  xp_gagne INT DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  condition JSONB
);

-- User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  badge_id INT REFERENCES badges(id),
  date_obtention TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50),
  canal VARCHAR(20),
  contenu TEXT,
  date_envoi TIMESTAMP,
  statut VARCHAR(20) DEFAULT 'pending'
);

-- Badges de base
INSERT INTO badges (nom, description, condition) VALUES
  ('Premier Sang', 'Premier don effectué', '{"nb_dons": 1}'),
  ('Donneur Régulier', '3 dons en 6 mois', '{"nb_dons": 3, "periode_mois": 6}'),
  ('Ambassadeur', '5 parrainages validés', '{"nb_parrainages": 5}');