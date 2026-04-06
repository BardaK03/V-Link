/**
 * Seed script: 10 evenimente diverse cu roluri si skill-uri necesare
 * Rulare: npx ts-node -r tsconfig-paths/register scripts/seed-events.ts
 *
 * Cerinte:
 * - .env in /backend cu DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
 * - Un user cu rol ORGANIZER sau ADMIN in baza de date (il cauta automat)
 * - Skill-urile sa existe deja (ruleaza seed-skills.sql inainte)
 */

import * as dotenv from 'dotenv';
import { Client } from 'pg';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

interface EventData {
  title: string;
  description: string;
  address: string;
  start_date: string;
  end_date: string;
  roles: RoleData[];
}

interface RoleData {
  role_name: string;
  description: string;
  slots_needed: number;
  hours_required: number;
  points_reward: number;
  skill_names: string[];
}

const EVENTS: EventData[] = [
  {
    title: 'Festival de Muzică și Arte ComunitART',
    description: 'Festival anual de artă și muzică în aer liber, cu ateliere creative pentru copii și adulți.',
    address: 'Parcul Herăstrău, București',
    start_date: '2026-06-15 10:00:00+03',
    end_date: '2026-06-15 22:00:00+03',
    roles: [
      {
        role_name: 'Coordonator scenă',
        description: 'Gestionează programul și logistica scenei principale.',
        slots_needed: 2,
        hours_required: 12,
        points_reward: 150,
        skill_names: ['Organizare evenimente', 'Comunicare publică', 'Management de proiect'],
      },
      {
        role_name: 'Fotograf eveniment',
        description: 'Documentează momentele cheie ale festivalului.',
        slots_needed: 3,
        hours_required: 8,
        points_reward: 100,
        skill_names: ['Fotografie', 'Editare video'],
      },
      {
        role_name: 'Manager social media',
        description: 'Postează live pe rețelele sociale ale organizației.',
        slots_needed: 2,
        hours_required: 6,
        points_reward: 80,
        skill_names: ['Social media management', 'Scriere de conținut'],
      },
    ],
  },
  {
    title: 'Maraton de Curățenie Urbană - EcoClean 2026',
    description: 'Acțiune de curățenie în parcurile și spațiile verzi din cartierul Floreasca.',
    address: 'Cartier Floreasca, București',
    start_date: '2026-04-22 08:00:00+03',
    end_date: '2026-04-22 14:00:00+03',
    roles: [
      {
        role_name: 'Coordonator echipă',
        description: 'Organizează voluntarii în echipe și coordonează zonele alocate.',
        slots_needed: 5,
        hours_required: 6,
        points_reward: 80,
        skill_names: ['Organizare evenimente', 'Comunicare publică'],
      },
      {
        role_name: 'Voluntar colectare deșeuri',
        description: 'Participă activ la curățarea spațiilor verzi.',
        slots_needed: 30,
        hours_required: 5,
        points_reward: 50,
        skill_names: ['Curățenie și igienizare', 'Colectare selectivă'],
      },
      {
        role_name: 'Educator ecologic',
        description: 'Explică participanților importanța reciclării și educației ecologice.',
        slots_needed: 3,
        hours_required: 5,
        points_reward: 70,
        skill_names: ['Ecologie și mediu', 'Educație nonformală'],
      },
    ],
  },
  {
    title: 'Hackathon Social Tech4Good',
    description: '48 de ore de inovație pentru soluții tech cu impact social. Echipe mixte de voluntari și mentori.',
    address: 'Hub-ul TechHub Iași, str. Ștefan cel Mare 1',
    start_date: '2026-05-10 09:00:00+03',
    end_date: '2026-05-12 18:00:00+03',
    roles: [
      {
        role_name: 'Dezvoltator web',
        description: 'Implementează soluțiile tehnice ale echipei.',
        slots_needed: 10,
        hours_required: 48,
        points_reward: 300,
        skill_names: ['Programare Web', 'React / Next.js', 'Node.js'],
      },
      {
        role_name: 'Designer UX/UI',
        description: 'Creează prototipuri și interfețe pentru proiectele echipelor.',
        slots_needed: 5,
        hours_required: 48,
        points_reward: 280,
        skill_names: ['Design UI/UX', 'Grafică și design grafic'],
      },
      {
        role_name: 'Mentor tehnic',
        description: 'Ghidează echipele în soluționarea problemelor tehnice.',
        slots_needed: 4,
        hours_required: 20,
        points_reward: 200,
        skill_names: ['Programare Web', 'Baze de date SQL', 'Management de proiect'],
      },
      {
        role_name: 'Facilitator workshop',
        description: 'Coordonează sesiunile de brainstorming și prezentările finale.',
        slots_needed: 3,
        hours_required: 30,
        points_reward: 180,
        skill_names: ['Facilitare workshop-uri', 'Comunicare publică'],
      },
    ],
  },
  {
    title: 'Campanie de Plantare - 1000 de Copaci pentru Cluj',
    description: 'Plantăm 1000 de copaci în zonele periferice ale orașului pentru a crește spațiile verzi.',
    address: 'Zona Florești - Câmpiile Turzii, Cluj-Napoca',
    start_date: '2026-03-21 07:30:00+02',
    end_date: '2026-03-21 16:00:00+02',
    roles: [
      {
        role_name: 'Voluntar plantare',
        description: 'Plantează copaci conform instrucțiunilor tehnice.',
        slots_needed: 50,
        hours_required: 7,
        points_reward: 90,
        skill_names: ['Plantare copaci', 'Ecologie și mediu'],
      },
      {
        role_name: 'Logistician',
        description: 'Distribuie uneltele și puieții pentru echipe.',
        slots_needed: 5,
        hours_required: 8,
        points_reward: 80,
        skill_names: ['Organizare evenimente', 'Construcții și renovări'],
      },
    ],
  },
  {
    title: 'Școala de Vară Digitală pentru Copii',
    description: 'Program educațional de 2 săptămâni pentru copii 8-14 ani: coding, robotică și creativitate digitală.',
    address: 'Liceul Teoretic nr. 5, Timișoara',
    start_date: '2026-07-01 09:00:00+03',
    end_date: '2026-07-14 16:00:00+03',
    roles: [
      {
        role_name: 'Instructor coding',
        description: 'Predă bazele programării vizuale (Scratch) și Python pentru copii.',
        slots_needed: 4,
        hours_required: 60,
        points_reward: 400,
        skill_names: ['Python', 'Programare Web', 'Lucru cu copii', 'Tutoriat / Meditații'],
      },
      {
        role_name: 'Animator activități creative',
        description: 'Coordonează activitățile artistice și digitale dintre sesiunile de coding.',
        slots_needed: 3,
        hours_required: 60,
        points_reward: 350,
        skill_names: ['Educație nonformală', 'Lucru cu copii', 'Grafică și design grafic'],
      },
      {
        role_name: 'Asistent instructor',
        description: 'Ajută instructorii principali și oferă suport individual copiilor.',
        slots_needed: 6,
        hours_required: 50,
        points_reward: 250,
        skill_names: ['Tutoriat / Meditații', 'Lucru cu copii'],
      },
    ],
  },
  {
    title: 'Caravana Sănătății - Consultații Gratuite',
    description: 'Caravană medicală mobilă cu consultații gratuite pentru comunități defavorizate din mediul rural.',
    address: 'Comună Fundulea, Călărași',
    start_date: '2026-09-05 08:00:00+03',
    end_date: '2026-09-07 17:00:00+03',
    roles: [
      {
        role_name: 'Asistent medical',
        description: 'Asistă medicii în consultații și pregătește materialele medicale.',
        slots_needed: 8,
        hours_required: 24,
        points_reward: 200,
        skill_names: ['Asistență medicală', 'Prim ajutor'],
      },
      {
        role_name: 'Consilier nutriție',
        description: 'Oferă sesiuni de educație nutrițională pacienților și familiilor.',
        slots_needed: 3,
        hours_required: 20,
        points_reward: 180,
        skill_names: ['Nutriție și sănătate', 'Comunicare publică'],
      },
      {
        role_name: 'Translator',
        description: 'Facilitează comunicarea cu comunitățile de romi sau maghiare.',
        slots_needed: 2,
        hours_required: 24,
        points_reward: 160,
        skill_names: ['Traducere / Interpretariat', 'Asistență socială'],
      },
      {
        role_name: 'Logistician caravană',
        description: 'Gestionează echipamentele medicale, transportul și cazarea echipei.',
        slots_needed: 2,
        hours_required: 30,
        points_reward: 150,
        skill_names: ['Management de proiect', 'Organizare evenimente'],
      },
    ],
  },
  {
    title: 'Ateliere de Meșteșuguri Tradiționale',
    description: 'Weekend de promovare a meșteșugurilor românești: olărit, țesut, pictură pe sticlă.',
    address: 'Muzeul Satului, București',
    start_date: '2026-10-17 10:00:00+03',
    end_date: '2026-10-18 18:00:00+03',
    roles: [
      {
        role_name: 'Instructor atelier',
        description: 'Predă tehnici tradiționale participanților din toate grupele de vârstă.',
        slots_needed: 6,
        hours_required: 16,
        points_reward: 160,
        skill_names: ['Facilitare workshop-uri', 'Muzică și arte', 'Educație nonformală'],
      },
      {
        role_name: 'Photographer & Documentarist',
        description: 'Documentează atelierele și creează conținut pentru promovare online.',
        slots_needed: 2,
        hours_required: 14,
        points_reward: 120,
        skill_names: ['Fotografie', 'Editare video', 'Social media management'],
      },
      {
        role_name: 'Responsabil relații publice',
        description: 'Primește vizitatorii, explică programul și facilitează înscrierea la ateliere.',
        slots_needed: 4,
        hours_required: 12,
        points_reward: 100,
        skill_names: ['Relații cu publicul', 'Comunicare publică'],
      },
    ],
  },
  {
    title: 'Program Mentorship pentru Tineri NEETs',
    description: 'Program de 3 luni de mentorship pentru tineri 18-25 ani care nu sunt în educație sau muncă.',
    address: 'Online + Hub Sibiu, str. Independenței 12',
    start_date: '2026-10-01 10:00:00+03',
    end_date: '2026-12-20 18:00:00+02',
    roles: [
      {
        role_name: 'Mentor carieră IT',
        description: 'Ghidează tinerii interesați de o carieră în tehnologie.',
        slots_needed: 5,
        hours_required: 40,
        points_reward: 300,
        skill_names: ['Programare Web', 'Tutoriat / Meditații', 'Psihologie / Consiliere'],
      },
      {
        role_name: 'Mentor antreprenoriat',
        description: 'Ajută tinerii să-și dezvolte idei de business și proiecte sociale.',
        slots_needed: 4,
        hours_required: 40,
        points_reward: 280,
        skill_names: ['Management de proiect', 'Comunicare publică', 'Facilitare workshop-uri'],
      },
      {
        role_name: 'Consilier psihologic',
        description: 'Oferă sesiuni de suport emoțional și consiliere în orientare profesională.',
        slots_needed: 3,
        hours_required: 50,
        points_reward: 320,
        skill_names: ['Psihologie / Consiliere', 'Asistență socială'],
      },
    ],
  },
  {
    title: 'Renovarea Căminului Cultural din Vâlcea',
    description: 'Renovare și reabilitare a căminului cultural dintr-o comună rurală defavorizată.',
    address: 'Comună Bujoreni, Vâlcea',
    start_date: '2026-08-10 07:00:00+03',
    end_date: '2026-08-17 18:00:00+03',
    roles: [
      {
        role_name: 'Voluntar construcții',
        description: 'Participă la lucrările de renovare: zugrăvit, montat parchet, reparații.',
        slots_needed: 20,
        hours_required: 56,
        points_reward: 400,
        skill_names: ['Construcții și renovări'],
      },
      {
        role_name: 'Coordonator șantier',
        description: 'Coordonează echipele de voluntari și planifică lucrările zilnice.',
        slots_needed: 2,
        hours_required: 60,
        points_reward: 350,
        skill_names: ['Construcții și renovări', 'Management de proiect', 'Comunicare publică'],
      },
      {
        role_name: 'Designer interior',
        description: 'Propune și implementează un concept de design pentru spațiile renovate.',
        slots_needed: 2,
        hours_required: 40,
        points_reward: 280,
        skill_names: ['Design UI/UX', 'Grafică și design grafic'],
      },
    ],
  },
  {
    title: 'Campanie Națională de Donare de Sânge',
    description: 'Organizarea de puncte de donare mobilă în 10 orașe din România, cu suport logistic și promovare.',
    address: 'Multiple locații (București, Cluj, Iași, Timișoara, Brașov)',
    start_date: '2026-11-14 07:00:00+02',
    end_date: '2026-11-14 19:00:00+02',
    roles: [
      {
        role_name: 'Coordonator punct donare',
        description: 'Gestionează un punct de donare: înregistrare donatori, comunicare cu personalul medical.',
        slots_needed: 10,
        hours_required: 12,
        points_reward: 150,
        skill_names: ['Organizare evenimente', 'Comunicare publică', 'Prim ajutor'],
      },
      {
        role_name: 'Ambasador campanie',
        description: 'Promovează campania în licee, universități și online.',
        slots_needed: 20,
        hours_required: 8,
        points_reward: 100,
        skill_names: ['Social media management', 'Relații cu publicul', 'Scriere de conținut'],
      },
      {
        role_name: 'Psiholog suport donatori',
        description: 'Oferă suport emoțional donatorilor anxioși și gestionează situațiile dificile.',
        slots_needed: 5,
        hours_required: 12,
        points_reward: 130,
        skill_names: ['Psihologie / Consiliere', 'Asistență medicală'],
      },
    ],
  },
];

async function getSkillIds(skillNames: string[]): Promise<number[]> {
  if (skillNames.length === 0) return [];
  const result = await client.query(
    'SELECT id, name FROM skills WHERE name = ANY($1)',
    [skillNames],
  );
  const found = result.rows.map((r: { id: number; name: string }) => r.id);
  const missing = skillNames.filter(
    (n) => !result.rows.some((r: { name: string }) => r.name === n),
  );
  if (missing.length > 0) {
    console.warn(`  ⚠️  Skill-uri negăsite (vor fi ignorate): ${missing.join(', ')}`);
  }
  return found;
}

async function findOrganizer(): Promise<string> {
  const result = await client.query(
    `SELECT id, email FROM users WHERE role IN ('ORGANIZER', 'ADMIN') LIMIT 1`,
  );
  if (result.rows.length === 0) {
    throw new Error('Nu există niciun user cu rol ORGANIZER sau ADMIN în baza de date!');
  }
  console.log(`✅ Folosesc organizatorul: ${result.rows[0].email} (${result.rows[0].id})`);
  return result.rows[0].id as string;
}

async function seedEvents(): Promise<void> {
  await client.connect();
  console.log('🔌 Conectat la baza de date.\n');

  const organizerId = await findOrganizer();

  let eventsCreated = 0;
  let rolesCreated = 0;

  for (const eventData of EVENTS) {
    // Verifică dacă evenimentul există deja
    const exists = await client.query(
      'SELECT id FROM events WHERE title = $1',
      [eventData.title],
    );
    if (exists.rows.length > 0) {
      console.log(`⏭️  Evenimentul "${eventData.title}" există deja, skip.`);
      continue;
    }

    // Inserează evenimentul
    const eventResult = await client.query(
      `INSERT INTO events (organizer_id, title, description, address, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        organizerId,
        eventData.title,
        eventData.description,
        eventData.address,
        eventData.start_date,
        eventData.end_date,
      ],
    );
    const eventId = eventResult.rows[0].id as string;
    eventsCreated++;
    console.log(`\n✅ Eveniment creat: "${eventData.title}" [${eventId}]`);

    // Inserează rolurile
    for (const role of eventData.roles) {
      const skillIds = await getSkillIds(role.skill_names);

      await client.query(
        `INSERT INTO event_roles (event_id, role_name, description, slots_needed, hours_required, points_reward, required_skills)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          eventId,
          role.role_name,
          role.description,
          role.slots_needed,
          role.hours_required,
          role.points_reward,
          skillIds,
        ],
      );
      rolesCreated++;
      console.log(`   └─ Rol: "${role.role_name}" | ${role.slots_needed} sloturi | ${role.points_reward} pts | Skills: [${role.skill_names.join(', ')}]`);
    }
  }

  console.log(`\n🎉 Seed complet: ${eventsCreated} evenimente, ${rolesCreated} roluri create.`);
  await client.end();
}

seedEvents().catch((err: unknown) => {
  console.error('❌ Eroare seed:', err);
  client.end();
  process.exit(1);
});
