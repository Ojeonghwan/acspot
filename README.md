# ACSpot

ACSpot은 폭염 상황에서 주변의 시원한 장소를 찾고, 사용자가 익명으로 에어컨 유무를 등록할 수 있는 모바일 우선 MVP입니다.

현재 프로젝트는 파리 지역을 기준으로 동작하며, Google Maps와 Google Places를 사용해 지도 위의 실제 장소를 보여주고, 사용자가 해당 장소의 에어컨 상태를 ACSpot 데이터베이스에 저장할 수 있도록 구성되어 있습니다.

## 현재 구현 범위

- Spring Boot 3 기반 백엔드
- PostgreSQL + PostGIS 데이터베이스
- Next.js + TypeScript 기반 프론트엔드
- Docker Compose 실행 환경
- Google Maps 지도 화면
- Google Places 기반 주변 장소 표시
- 지도/리스트 화면 전환
- 카테고리 필터
- 장소 검색
- 장소 상세 하단 시트
- 익명 에어컨 상태 등록
- 등록된 장소의 에어컨 상태 요약
- Swagger/OpenAPI 문서

로그인, OAuth, 즐겨찾기, 사진 업로드, 신고 관리, Redis, Kafka, 운영용 지도 인프라는 1차 MVP 범위에서 제외했습니다.

## 프로젝트 구조

```text
acSpot/
  backend/              Spring Boot 백엔드
  database/             데이터베이스 초기화 스크립트
  frontend/             Next.js 프론트엔드
    app/
    components/
    lib/
  docker-compose.yml
  README.md
```

## 실행 방법

프로젝트 루트에서 실행합니다.

```bash
docker compose up --build
```

실행 후 접속 주소는 다음과 같습니다.

```text
프론트엔드: http://localhost:3000
백엔드:     http://localhost:8080
Swagger:   http://localhost:8080/swagger-ui/index.html
DB:        localhost:5432
```

## Google Maps API 키 설정

프론트엔드에서 Google Maps를 사용하려면 `frontend/.env.local` 파일이 필요합니다.

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

필요한 Google API는 다음과 같습니다.

```text
Maps JavaScript API
Places API
```

API 키는 Google Cloud Console에서 반드시 제한을 걸어야 합니다.

```text
HTTP referrer 예시:
http://localhost:3000/*

API 제한:
Maps JavaScript API
Places API
```

`frontend/.env.local`은 `.gitignore`에 포함되어 있으므로 깃에는 올라가지 않습니다.

## 프론트엔드 흐름

현재 ACSpot의 핵심 흐름은 다음과 같습니다.

```text
1. Google Maps를 화면에 표시
2. 현재 지도 영역에 보이는 Google Places 장소를 표시
3. 사용자가 지도 위 장소를 클릭
4. 기존 하단 시트에 장소 정보 표시
5. 사용자가 A/C is on, Not sure, No A/C 중 하나 선택
6. 저장 시 ACSpot DB에 장소와 에어컨 상태 등록
7. 이후 해당 장소는 ACSpot 등록 장소로 표시
```

Google 지도에 기본으로 보이는 장소를 클릭해도 같은 등록 화면이 열립니다.

## 백엔드 API

현재 구현된 주요 API는 다음과 같습니다.

```text
GET  /api/places/nearby?lat=48.8566&lng=2.3522&radius=1000
GET  /api/places/{placeId}?anonymousId=device-uuid
GET  /api/places/search?keyword=cafe
POST /api/places
PUT  /api/places/{placeId}/ac-report
```

외부 장소 등록은 `POST /api/places`로 처리합니다.

Google Places에서 선택한 장소는 다음 정보를 기반으로 ACSpot DB에 저장됩니다.

```text
sourceType: GOOGLE
googlePlaceId
name
category
address
latitude
longitude
googleMapsUrl
```

## 익명 등록 정책

- 프론트엔드는 브라우저에서 `anonymousId`를 생성합니다.
- 생성된 값은 `localStorage`에 저장됩니다.
- 백엔드는 `anonymous_id`로 저장합니다.
- 같은 사용자는 같은 장소에 대해 하나의 최신 리포트만 유지합니다.
- 서로 다른 브라우저나 기기의 중복 리포트는 MVP 단계에서 허용합니다.

## 주요 도메인 모델

```text
Place
  Google, OSM, 수동 등록 장소의 기본 정보와 위치 정보를 저장합니다.

AcReport
  익명 사용자의 장소별 에어컨 상태 리포트를 저장합니다.

PlaceAcSummary
  장소별 리포트 수, 신뢰도, 현재 에어컨 상태 요약을 저장합니다.
```

## 프론트엔드 로컬 실행

```bash
cd frontend
npm install
npm run dev
```

## 백엔드 로컬 실행

Java 17과 Gradle이 필요합니다.

```bash
cd backend
gradle bootRun
```

## 데이터베이스만 실행

```bash
docker compose up -d db
```

## 현재 주의사항

- Google Maps API 키에는 결제 계정 연결과 사용량 제한 설정이 필요합니다.
- 현재 지도 구현은 Google Places 결과와 ACSpot DB 등록 장소를 함께 보여줍니다.
- Google의 기존 `PlacesService`, `Marker` API 사용 경고가 콘솔에 표시될 수 있습니다.
- 추후 안정화를 위해 신규 Places API와 Advanced Marker 방식으로 마이그레이션할 수 있습니다.
- 운영 배포 시에는 localhost 외 실제 도메인을 Google API 키 referrer에 추가해야 합니다.
