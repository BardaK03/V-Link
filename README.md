Subiect + Idei Implementare
1. Arhitectură & Hosting (Ecosistemul "V-Link")
•	Frontend: Next.js + React + Tailwind CSS → Hostat pe Azure Static Web Apps
•	Backend (Core Logic): NestJS (Microservicii) → Hostat pe Azure Container Apps (Scale to zero)
•	Servicii AI / Data: FastAPI (Python) → Hostat pe Azure Container Apps
•	Bază de Date & Autentificare: Supabase Cloud (Free Tier)
2. Feature → Framework / Microserviciu 
Feature	Frontend	Backend / Microserviciu	DB / Alte tehnologi
Creare evenimente & necesități 	Next.js + React + Tailwind (form, calendar) 	NestJS – Event Service 	Supabase (PostgreSQL: events, event_roles)
Aplicare voluntari & distribuție automată 	Formulare aplicație 	NestJS → (Kafka potențial pentru scaling) → FastAPI – Matching Service 	Supabase (PostgreSQL: applications)
Rewards (badge-uri & puncte) 	Dashboard puncte & badge-uri 	NestJS – Gamification Service 	Supabase (PostgreSQL: points, badges)
Calendar interactiv & notificări 	React Calendar UI 	NestJS – Event + Notification Service 	Supabase (PostgreSQL) + Supabase Realtime / Web Push API
Integrare social media & Auth 	Butoane share, login OAuth 	NestJS – Auth Service 	Supabase Auth + Supabase DB (users)
Leaderboard & statistici 	Pagina leaderboard & profil voluntar 	NestJS – Gamification Service + FastAPI – Analytics Service 	Supabase (PostgreSQL: query live rankings)
Marketplace de beneficii 	Pagina marketplace 	NestJS – Marketplace Service 	Supabase (PostgreSQL: marketplace, transactions)
Diplome NFT 	UI claim & vizualizare NFT 	NestJS – NFT Service 	Work in progress (Opțional) 
3. Flux general 
1.	Organizator creează eveniment → NestJS → Supabase PostgreSQL → (Opțional) Kafka event „eveniment creat”. 
2.	Voluntar aplică → NestJS → (Kafka) → FastAPI Matching → update status în Supabase → notificare push. 
3.	Activitate finalizată → NestJS Gamification → update puncte + leaderboard în Supabase. 
4.	Puncte folosite → Marketplace Service → tranzacții/reduceri înregistrate în Supabase. 
5.	Chatbot → FastAPI → interacțiune UI React. 
4. Platforma de voluntariat bazată pe microservicii 
•	Organizatorii creează evenimente și necesități (ex: 5 voluntari la intrare, 3 la tehnic). 
•	Voluntarii aplică și sunt distribuiți automat în funcție de competențe prin scorul de matching generat de FastAPI. 
•	Sistem de rewards cu badge-uri și recompense pentru a motiva voluntarii. 
•	Calendar interactiv și notificări push pentru organizare eficientă (sync cu Google Calendars). 
•	Integrare cu rețele sociale pentru recrutare mai ușoară (butoane cu forwarding la profilul de social media). 
•	Leaderboard & Statistici – Clasament cu cei mai activi voluntari + statistici personalizate (ore lucrate, badge-uri, experiență acumulată). 
•	Marketplace de Beneficii – Voluntarii își pot folosi punctele câștigate pentru a obține reduceri la bilete, produse sau cursuri online. 
•	Integrarea diplomelor drept NFT-uri (opțional, dacă nu e destul de complex proiectul). 

