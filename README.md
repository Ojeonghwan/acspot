# ACSpot

ACSpot is a mobile-first MVP for finding nearby cool places during heat waves and anonymously reporting whether a place has air conditioning.

## MVP scope

Phase 1-6 includes:

- Monorepo structure
- Spring Boot 3 backend scaffold
- PostgreSQL + PostGIS Docker Compose setup
- Core JPA entities and repositories
- Swagger/OpenAPI setup
- Next.js + TypeScript frontend scaffold
- Anonymous report domain model
- Figma-inspired mobile UI with map/list modes, filters, search, place cards, and report bottom sheet
- Frontend API client wired to nearby, search, detail, and report endpoints
- OpenStreetMap map view through Leaflet
- OpenStreetMap/Nominatim search candidates for unregistered places

Login, OAuth, favorites, photos, report flags, Redis, Kafka, and full OSM data pipelines are intentionally excluded from the first MVP.

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

Set the backend base URL with:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

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

## Backend API

Implemented backend endpoints:

```text
GET  /api/places/nearby?lat=48.8566&lng=2.3522&radius=1000
GET  /api/places/{placeId}?anonymousId=device-uuid
GET  /api/places/search?keyword=cafe
POST /api/places
PUT  /api/places/{placeId}/ac-report
```

Current notes:

- Nearby search uses an MVP in-memory Haversine distance filter over ACTIVE places.
- Search queries registered DB places.
- New external OSM candidates can be registered through `POST /api/places` with `sourceType: "OSM"` and `osmId`.
- AC reports are upserted by `anonymousId + placeId`.
- `place_ac_summaries` is recalculated after each report.
- Local frontend CORS is enabled for `localhost:3000` and `127.0.0.1:3000`.

## Frontend behavior

The frontend calls the backend through `frontend/lib/api.ts`.

Connected flows:

```text
Initial load       -> GET /api/places/nearby
Search input       -> DB search + OpenStreetMap/Nominatim candidates
Place selection    -> GET /api/places/{placeId}
OSM candidate tap  -> POST /api/places, then opens the normal report bottom sheet
Report save        -> PUT /api/places/{placeId}/ac-report
anonymousId source -> localStorage via frontend/lib/anonymousId.ts
```

If the database has no places yet, the app will show an empty state until places are registered through the API or selected from OSM search results.

## Phase 6 OpenStreetMap and Leaflet

The map view now uses open-source mapping by default:

```text
Map rendering      -> Leaflet + OpenStreetMap tiles
Search candidates  -> Nominatim search API
Registered places  -> ACSpot backend database
Place reports      -> ACSpot backend database
```

No Google Maps API key is required.

For production traffic, do not depend heavily on the public OpenStreetMap tile or Nominatim servers. Move to a provider with an SLA, a self-hosted tile server, or a dedicated OSM-based search service when usage grows.