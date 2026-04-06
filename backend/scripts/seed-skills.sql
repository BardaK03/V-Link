-- Seed: 35 skill-uri pentru platforma V-Link
-- Rulează pe serverul Ubuntu: psql -U <user> -d <db> -f seed-skills.sql

INSERT INTO skills (name) VALUES
  -- IT & Tech
  ('Programare Web'),
  ('React / Next.js'),
  ('Node.js'),
  ('Baze de date SQL'),
  ('Python'),
  ('Design UI/UX'),
  ('Editare video'),
  ('Fotografie'),
  ('Grafică și design grafic'),
  ('Social media management'),

  -- Comunicare & Organizare
  ('Comunicare publică'),
  ('Scriere de conținut'),
  ('Traducere / Interpretariat'),
  ('Organizare evenimente'),
  ('Management de proiect'),
  ('Recrutare voluntari'),
  ('Facilitare workshop-uri'),
  ('Relații cu publicul'),

  -- Educație & Social
  ('Tutoriat / Meditații'),
  ('Lucru cu copii'),
  ('Lucru cu vârstnici'),
  ('Asistență socială'),
  ('Psihologie / Consiliere'),
  ('Educație nonformală'),
  ('Predare limbi străine'),

  -- Mediu & Comunitate
  ('Ecologie și mediu'),
  ('Curățenie și igienizare'),
  ('Plantare copaci'),
  ('Colectare selectivă'),
  ('Construcții și renovări'),

  -- Sănătate & Urgențe
  ('Prim ajutor'),
  ('Asistență medicală'),
  ('Nutriție și sănătate'),
  ('Sport și fitness'),

  -- Artistic & Cultural
  ('Muzică și arte')

ON CONFLICT (name) DO NOTHING;

SELECT COUNT(*) as total_skills FROM skills;
