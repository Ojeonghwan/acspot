# ACSpot Jenkins 자동배포 설정

이 저장소에는 Jenkins가 읽을 `Jenkinsfile`이 포함되어 있습니다.
GitHub `main` 브랜치에 push가 들어오면 Jenkins가 빌드 검증 후 서버에 접속해서 Docker Compose로 재배포하는 구조입니다.

## 필요한 Jenkins 설정

1. Jenkins에 플러그인 설치
   - Pipeline
   - Git
   - GitHub
   - SSH Agent

2. Jenkins Credentials 추가
   - 종류: SSH Username with private key
   - ID: `acspot-deploy-key`
   - Username: `ubuntu`
   - Private Key: 서버 접속에 사용하는 pem 키 내용

3. Jenkins Pipeline Job 생성
   - Pipeline script from SCM 선택
   - SCM: Git
   - Repository URL: `https://github.com/Ojeonghwan/acspot.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`

4. GitHub Webhook 추가
   - Repository Settings > Webhooks > Add webhook
   - Payload URL: `http://JENKINS_SERVER/github-webhook/`
   - Content type: `application/json`
   - Event: Just the push event

## 배포 서버 전제 조건

서버에는 아래 경로에 프로젝트가 clone 되어 있어야 합니다.

```text
/opt/acspot
```

그리고 서버의 `/opt/acspot/frontend/.env.local` 파일이 존재해야 합니다.
이 파일은 API Key를 포함하므로 Git에 올리지 않습니다.

예시:

```text
NEXT_PUBLIC_API_BASE_URL=http://13.125.234.71
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Jenkinsfile 동작

1. GitHub 코드 checkout
2. 프론트엔드 빌드 검증
3. 백엔드 빌드 검증
4. `main` 브랜치일 때만 서버 접속
5. 서버에서 최신 코드로 갱신
6. `docker-compose.deploy.yml` 기준으로 재빌드/재실행
7. 웹/API health check 수행

## 주의

- 현재 배포 주소는 `http://13.125.234.71/`입니다.
- 위치 기능은 배포 환경에서 HTTPS가 필요할 수 있습니다.
- Google Maps API Key 제한에는 배포 주소 referrer가 포함되어야 합니다.
