# ACSpot

ACSpot is a mobile-first MVP for finding nearby cool places during heat waves and anonymously reporting whether a place has air conditioning.

## MVP scope

Phase 1-3 includes:

- Monorepo structure
- Spring Boot 3 backend scaffold
- PostgreSQL + PostGIS Docker Compose setup
- Core JPA entities and repositories
- Swagger/OpenAPI setup
- Next.js + TypeScript frontend scaffold
- Anonymous report domain model
- Figma-inspired mobile mock UI with map/list modes, filters, search, place cards, and report bottom sheet

Login, OAuth, favorites, photos, report flags, Redis, Kafka, and OSM pipelines are intentionally excluded from the first MVP.

## Structure

```text
acSpot/
  backend/
  database/
  frontend/
    app/
    components/
    lib/
  docker-compose.yml
  README.md
```

## Run with Docker Compose

```bash
docker compose up --build
```

Services:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8080
Swagger:  http://localhost:8080/swagger-ui/index.html
Database: localhost:5432
```

## Run database only

```bash
docker compose up -d db
```

## Backend local run

The backend uses Java 17 and Gradle.

```bash
cd backend
gradle bootRun
```

## Frontend local run

```bash
cd frontend
npm install
npm run dev
```

## Frontend Phase 3 behavior

The current UI uses mock data from `frontend/lib/mockPlaces.ts` and supports:

- Map/list toggle
- Category filters
- Search results
- Place cards
- Mock map markers
- Bottom sheet reporting flow
- Temporary save/register toast

## Domain model

```text
Place
  Stores Google/OSM/manual place metadata and PostGIS location.

AcReport
  Stores the latest anonymous air-conditioning report per anonymousId + place.

PlaceAcSummary
  Stores aggregated report counts and current AC status per place.
```

## Anonymous reporting policy

- The frontend generates an `anonymousId` and stores it in `localStorage`.
- The backend stores it as `anonymous_id`.
- One `anonymousId` can keep only one latest report per place.
- Duplicate reports from different browsers or devices are accepted in the first MVP.
