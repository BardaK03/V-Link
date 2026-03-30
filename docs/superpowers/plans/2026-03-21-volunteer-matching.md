# Volunteer Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-compute un scor de potrivire (0-100) între skill-urile unui voluntar și cerințele unui rol, folosind similaritatea Jaccard printr-un microserviciu FastAPI, afișat organizatorului în pagina de aplicații.

**Architecture:**
Voluntarul aplică → `ApplicationsService.apply()` face POST la FastAPI `/match` cu listele de skill-uri → FastAPI calculează Jaccard → NestJS salvează `match_score` pe `Application`. Organizatorul vede aplicanții sortați descrescător după scor.

**Tech Stack:** FastAPI + Uvicorn (Python 3.11), `@nestjs/axios`, Docker Compose, Next.js (frontend existent)

---

## Contextul datelor din V-Link

- **Skill-urile voluntarului** → tabela `user_skills` (user_id: uuid, skill_id: int)
- **Skill-urile cerute de rol** → `event_roles.required_skills` (int[])
- **Scorul** → `applications.match_score` (nullable int, deja în entitate)
- **Jaccard:** `score = |intersection| / |union| × 100`
  - Dacă rolul nu are cerințe: scor 100 (oricine se califică)
  - Dacă voluntarul nu are skill-uri și rolul are cerințe: scor 0

---

## File Map

### Fișiere noi
| Fișier | Responsabilitate |
|--------|-----------------|
| `fast-services/matching/main.py` | Pornire FastAPI, CORS, include router |
| `fast-services/matching/routers/match.py` | Endpoint POST `/match`, logica Jaccard |
| `fast-services/matching/requirements.txt` | Dependențe Python |
| `fast-services/matching/tests/test_match.py` | Teste unitare pentru Jaccard |
| `docker-compose.yml` | Orchestrare backend + FastAPI |
| `backend/src/matching/matching.service.ts` | HTTP client NestJS → FastAPI |
| `backend/src/matching/matching.module.ts` | NestJS module pentru MatchingService |

### Fișiere modificate
| Fișier | Ce se schimbă |
|--------|--------------|
| `backend/src/applications/applications.service.ts` | Apel matching după `apply()` |
| `backend/src/applications/applications.module.ts` | Import MatchingModule + UserSkill entity |
| `backend/package.json` | Adaugă `@nestjs/axios`, `axios` |
| `frontend/src/app/(dashboard)/events/[id]/applications/page.tsx` | Sort by match_score + afișare badge scor |

---

## Task 1: FastAPI — Microserviciul de matching

**Files:**
- Create: `fast-services/matching/requirements.txt`
- Create: `fast-services/matching/tests/test_match.py`
- Create: `fast-services/matching/routers/match.py`
- Create: `fast-services/matching/main.py`

- [ ] **Step 1: Creează structura de directoare și requirements.txt**

```
fast-services/
  matching/
    routers/
      __init__.py
      match.py
    tests/
      __init__.py
      test_match.py
    main.py
    requirements.txt
```

`requirements.txt`:
```
fastapi==0.111.0
uvicorn==0.29.0
pydantic==2.7.0
pytest==8.2.0
httpx==0.27.0
```

- [ ] **Step 2: Scrie testele pentru logica Jaccard (RED)**

`fast-services/matching/tests/test_match.py`:
```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_perfect_match():
    """Voluntarul are exact skill-urile cerute → 100"""
    res = client.post("/match", json={"volunteer_skills": [1, 2, 3], "role_skills": [1, 2, 3]})
    assert res.status_code == 200
    assert res.json()["score"] == 100


def test_no_match():
    """Voluntarul nu are nicio skill cerută → 0"""
    res = client.post("/match", json={"volunteer_skills": [4, 5], "role_skills": [1, 2, 3]})
    assert res.status_code == 200
    assert res.json()["score"] == 0


def test_partial_match():
    """Jaccard: |{1}| / |{1,2,3}| = 1/3 ≈ 33"""
    res = client.post("/match", json={"volunteer_skills": [1], "role_skills": [1, 2, 3]})
    assert res.status_code == 200
    assert res.json()["score"] == 33


def test_role_no_requirements():
    """Rol fără cerințe → oricine se califică → 100"""
    res = client.post("/match", json={"volunteer_skills": [1, 2], "role_skills": []})
    assert res.status_code == 200
    assert res.json()["score"] == 100


def test_both_empty():
    """Ambele goale → 100 (nicio cerință)"""
    res = client.post("/match", json={"volunteer_skills": [], "role_skills": []})
    assert res.status_code == 200
    assert res.json()["score"] == 100


def test_volunteer_no_skills():
    """Voluntarul fără skill-uri, rol cu cerințe → 0"""
    res = client.post("/match", json={"volunteer_skills": [], "role_skills": [1, 2]})
    assert res.status_code == 200
    assert res.json()["score"] == 0
```

- [ ] **Step 3: Rulează testele să confirmi că FAIL**

```bash
cd fast-services/matching
pip install -r requirements.txt
pytest tests/ -v
```

Expected: `ModuleNotFoundError` — `main` nu există încă.

- [ ] **Step 4: Implementează router-ul Jaccard**

`fast-services/matching/routers/match.py`:
```python
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class MatchRequest(BaseModel):
    volunteer_skills: list[int]
    role_skills: list[int]


class MatchResponse(BaseModel):
    score: int


@router.post("/match", response_model=MatchResponse)
def compute_match(payload: MatchRequest) -> MatchResponse:
    role_set = set(payload.role_skills)

    # Rol fără cerințe → oricine se califică
    if not role_set:
        return MatchResponse(score=100)

    volunteer_set = set(payload.volunteer_skills)
    intersection = volunteer_set & role_set
    union = volunteer_set | role_set

    score = int(len(intersection) / len(union) * 100)
    return MatchResponse(score=score)
```

`fast-services/matching/routers/__init__.py`: (gol)

`fast-services/matching/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.match import router

app = FastAPI(title="V-Link Matching Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}
```

`fast-services/matching/tests/__init__.py`: (gol)

- [ ] **Step 5: Rulează testele să confirmi că PASS**

```bash
cd fast-services/matching
pytest tests/ -v
```

Expected: toate 6 teste PASS.

- [ ] **Step 6: Testează manual serverul**

```bash
uvicorn main:app --port 8000 --reload
curl -X POST http://localhost:8000/match \
  -H "Content-Type: application/json" \
  -d '{"volunteer_skills": [1,2], "role_skills": [1,3]}'
# Expected: {"score": 33}
```

- [ ] **Step 7: Commit**

```bash
git add fast-services/
git commit -m "feat: FastAPI matching service cu Jaccard similarity"
```

---

## Task 2: Docker Compose

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Creează docker-compose.yml**

`docker-compose.yml` (la rădăcina proiectului):
```yaml
version: '3.9'

services:
  matching:
    build:
      context: ./fast-services/matching
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
```

`fast-services/matching/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Verifică build-ul Docker**

```bash
docker compose build matching
docker compose up matching -d
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml fast-services/matching/Dockerfile
git commit -m "feat: Docker Compose pentru matching service"
```

---

## Task 3: NestJS — MatchingModule

**Files:**
- Create: `backend/src/matching/matching.service.ts`
- Create: `backend/src/matching/matching.module.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: Instalează dependențele**

```bash
cd backend
npm install @nestjs/axios axios
```

- [ ] **Step 2: Creează MatchingService**

`backend/src/matching/matching.service.ts`:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private readonly matchingUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.matchingUrl = this.configService.get<string>('MATCHING_SERVICE_URL') ?? 'http://localhost:8000';
  }

  async computeScore(volunteerSkills: number[], roleSkills: number[]): Promise<number> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<{ score: number }>(`${this.matchingUrl}/match`, {
          volunteer_skills: volunteerSkills,
          role_skills: roleSkills,
        }),
      );
      return data.score;
    } catch (error) {
      // Degradare grațioasă: dacă FastAPI e down, scorul rămâne null
      this.logger.warn(`Matching service unavailable: ${(error as Error).message}`);
      return null;
    }
  }
}
```

`backend/src/matching/matching.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MatchingService } from './matching.service';

@Module({
  imports: [HttpModule],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
```

- [ ] **Step 3: Adaugă MATCHING_SERVICE_URL în .env**

`backend/.env`:
```
MATCHING_SERVICE_URL=http://localhost:8000
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/matching/ backend/.env
git commit -m "feat: NestJS MatchingModule cu HTTP client către FastAPI"
```

---

## Task 4: Integrare în ApplicationsService

**Files:**
- Modify: `backend/src/applications/applications.service.ts`
- Modify: `backend/src/applications/applications.module.ts`

- [ ] **Step 1: Actualizează ApplicationsModule**

`backend/src/applications/applications.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { EventRole } from '../event-roles/entities/event-role.entity';
import { UserSkill } from '../user-skills/entities/user-skill.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, EventRole, UserSkill]),
    UsersModule,
    EventsModule,
    AuthModule,
    MatchingModule,
  ],
  providers: [ApplicationsService],
  controllers: [ApplicationsController],
})
export class ApplicationsModule {}
```

- [ ] **Step 2: Actualizează ApplicationsService.apply() să calculeze scorul**

Modifică metoda `apply()` din `backend/src/applications/applications.service.ts`:

```typescript
// Adaugă importuri la top:
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSkill } from '../user-skills/entities/user-skill.entity';
import { MatchingService } from '../matching/matching.service';

// Adaugă în constructor:
@InjectRepository(UserSkill)
private readonly userSkillRepo: Repository<UserSkill>,
private readonly matchingService: MatchingService,

// Înlocuiește metoda apply():
async apply(authId: string, dto: CreateApplicationDto): Promise<Application> {
  const user = await this.usersService.findByAuthId(authId);
  if (!user) throw new NotFoundException('User not found');

  const role = await this.roleRepo.findOne({ where: { id: dto.role_id } });
  if (!role) throw new NotFoundException('Role not found');

  const existing = await this.appRepo.findOne({
    where: { user_id: user.id, role_id: dto.role_id },
  });
  if (existing) throw new ConflictException('You have already applied to this role');

  // Obține skill-urile voluntarului
  const userSkills = await this.userSkillRepo.find({ where: { user_id: user.id } });
  const volunteerSkillIds = userSkills.map((us) => us.skill_id);

  // Calculează scorul de potrivire
  const matchScore = await this.matchingService.computeScore(
    volunteerSkillIds,
    role.required_skills ?? [],
  );

  const application = this.appRepo.create({
    user_id: user.id,
    role_id: dto.role_id,
    status: ApplicationStatus.PENDING,
    match_score: matchScore,
  });

  return this.appRepo.save(application);
}
```

- [ ] **Step 3: Verifică că backend-ul compilează fără erori**

```bash
cd backend
npm run build
```

Expected: fără erori TypeScript.

- [ ] **Step 4: Commit**

```bash
git add backend/src/applications/
git commit -m "feat: calcul automat match_score la aplicare"
```

---

## Task 5: Frontend — Sortare și afișare match_score

**Files:**
- Modify: `frontend/src/app/(dashboard)/events/[id]/applications/page.tsx`

**Context:** Organizatorul vede lista de aplicanți pentru fiecare rol. Adăugăm:
1. Sortare descrescătoare după `match_score` în interiorul fiecărui grup (rol)
2. Badge colorat: verde ≥ 70, galben 40-69, roșu < 40, gri dacă null

- [ ] **Step 1: Adaugă helper-ul de culoare și sortarea în pagina de aplicații**

Modifică `frontend/src/app/(dashboard)/events/[id]/applications/page.tsx`:

```tsx
// Adaugă funcția de culoare badge după STATUS_COLORS:
function scoreColor(score: number | null): string {
  if (score === null) return 'bg-gray-100 text-gray-500'
  if (score >= 70) return 'bg-green-100 text-green-800'
  if (score >= 40) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

// Modifică gruparea să includă sortarea:
const grouped = applications.reduce<Record<string, Application[]>>((acc, app) => {
  const key = app.role?.role_name ?? 'Rol necunoscut'
  return { ...acc, [key]: [...(acc[key] ?? []), app] }
}, {})

// Sortează fiecare grup descrescător după match_score
const sortedGrouped = Object.fromEntries(
  Object.entries(grouped).map(([role, apps]) => [
    role,
    [...apps].sort((a, b) => (b.match_score ?? -1) - (a.match_score ?? -1)),
  ]),
)
```

Modifică render-ul să folosească `sortedGrouped` și să afișeze badge-ul:

```tsx
// În cardul aplicantului, lângă status badge, adaugă:
<span className={`text-xs px-2 py-1 rounded-full font-medium ${scoreColor(app.match_score)}`}>
  {app.match_score !== null ? `${app.match_score}% potrivire` : 'Scor N/A'}
</span>
```

- [ ] **Step 2: Verifică în browser**

1. Pornește FastAPI: `cd fast-services/matching && uvicorn main:app --port 8000`
2. Pornește backend: `cd backend && npm run start:dev`
3. Pornește frontend: `cd frontend && npm run dev`
4. Aplică la un rol ca voluntar
5. Ca organizator, deschide `/events/{id}/applications` — verifică că scorul apare și aplicanții sunt sortați

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/\(dashboard\)/events/
git commit -m "feat: sort aplicanti dupa match_score + badge vizual"
```

---

## Task 6: Verificare end-to-end

- [ ] Voluntar fără skill-uri aplică la rol cu cerințe → `match_score = 0`
- [ ] Voluntar cu skill-urile exacte → `match_score = 100`
- [ ] Rol fără cerințe → `match_score = 100` indiferent de skill-uri
- [ ] FastAPI down → aplicarea merge, `match_score = null`, badge "Scor N/A"
- [ ] Organizatorul vede aplicanții sortați descrescător în pagina de aplicații

---

## Rulare locală (fără Docker)

```bash
# Terminal 1 — FastAPI
cd fast-services/matching
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload

# Terminal 2 — NestJS backend
cd backend
npm run start:dev

# Terminal 3 — Next.js frontend
cd frontend
npm run dev
```

## Rulare cu Docker

```bash
docker compose up matching -d
cd backend && npm run start:dev
cd frontend && npm run dev
```
