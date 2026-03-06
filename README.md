# Workshop Booking & Payments App

Production-shaped Angular 21 workspace for workshop catalog, basket, checkout, and booking confirmation.

## Prerequisites

- Docker Desktop (or Docker Engine with Docker Compose v2)

## Install Dependencies (Docker)

```powershell
docker compose run --rm app npm run install
```

## Run the App (Docker)

```powershell
docker compose up app
```

The app is available at `http://localhost:4200`.

## Production Build (Prerender Strategy)

This app uses **prerendered static output** for key marketing routes:
- `/`
- `/catalog`

The route list is maintained in `src/prerender-routes.txt`.

Run:

```powershell
npm run build
```

Build output is generated under `dist/angular-sandbox/browser`.

## i18n

- Source locale: `en-GB`
- Additional locale: `fr`

Extract translation messages:

```powershell
npm run i18n:extract
```

Build localized bundles:

```powershell
npm run build:localize
```

## Run Individual Checks (Docker)

```powershell
docker compose run --rm app npm run lint
docker compose run --rm app npm test
docker compose run --rm app npm run build
```

## Run Full Verification

```powershell
pwsh tools/verify/Invoke-All.ps1
```

The verification script runs `format:check -> lint -> test:ci -> build` and stops on first failure.

## Production Docker Path

Build and run the production image:

```powershell
docker compose --profile production up --build app-prod
```

The production app is served at `http://localhost:8080`.
