# Angular Sandbox (TSK-01)

Baseline Angular 21.0.0 sandbox for Team Tasks with a Docker-first workflow.

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

The verification script runs `lint -> test -> build` and stops on first failure.
