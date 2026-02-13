# Dockerfile Specifications

**Feature**: 004-k8s-local-deploy
**Date**: 2026-02-14

## Backend Dockerfile (`backend/Dockerfile`)

### Build Stages

| Stage   | Base Image         | Purpose                           |
| ------- | ------------------ | --------------------------------- |
| builder | python:3.12-slim   | Install dependencies              |
| runtime | python:3.12-slim   | Run application with minimal size |

### Build Steps
1. **builder stage**: Copy requirements.txt, install dependencies to a virtual environment
2. **runtime stage**: Copy virtual environment and application code, expose port 8000

### Environment
- Working directory: `/app`
- Exposed port: `8000`
- Entrypoint: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Required Runtime Environment Variables
| Variable           | Required | Description                    |
| ------------------ | -------- | ------------------------------ |
| DATABASE_URL       | Yes      | PostgreSQL connection string   |
| BETTER_AUTH_SECRET | Yes      | Shared auth secret             |
| OPENAI_API_KEY     | Yes      | OpenAI API key                 |
| BETTER_AUTH_URL    | Yes      | Frontend URL for JWKS          |
| FRONTEND_URL       | No       | Frontend URL for CORS          |

### Size Target: < 300MB

---

## Frontend Dockerfile (`frontend/Dockerfile`)

### Build Stages

| Stage   | Base Image      | Purpose                                |
| ------- | --------------- | -------------------------------------- |
| deps    | node:22-alpine  | Install npm dependencies               |
| builder | node:22-alpine  | Build Next.js application              |
| runner  | node:22-alpine  | Run standalone Next.js server          |

### Build Steps
1. **deps stage**: Copy package.json and package-lock.json, run npm ci
2. **builder stage**: Copy source code and deps, set build args, run `next build`
3. **runner stage**: Copy standalone output, static assets, and public dir

### Build Arguments
| Argument               | Required | Description                            |
| ---------------------- | -------- | -------------------------------------- |
| NEXT_PUBLIC_API_URL    | Yes      | Backend URL baked into client JS       |

### Environment
- Working directory: `/app`
- Exposed port: `3000`
- Entrypoint: `node server.js` (standalone output)
- `HOSTNAME=0.0.0.0` (required for standalone server binding)

### Required Runtime Environment Variables
| Variable           | Required | Description                        |
| ------------------ | -------- | ---------------------------------- |
| BETTER_AUTH_URL    | Yes      | Auth base URL (external)           |
| BETTER_AUTH_SECRET | Yes      | Shared auth secret                 |
| DATABASE_URL       | Yes      | PostgreSQL connection (for auth)   |

### Prerequisite
- Next.js config must include `output: "standalone"` for minimal production build.

### Size Target: < 500MB
