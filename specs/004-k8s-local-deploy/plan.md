# Implementation Plan: Local Kubernetes Deployment

**Branch**: `004-k8s-local-deploy` | **Date**: 2026-02-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/004-k8s-local-deploy/spec.md`

## Summary

Containerize the Phase III Todo Chatbot (Next.js frontend + FastAPI backend) with production-ready Dockerfiles, package them into a Helm chart with all Kubernetes resources, and deploy to a local Minikube cluster. The application connects to the existing external Neon PostgreSQL database — no local database is deployed.

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript 5+ / Node.js 22 (frontend)
**Primary Dependencies**: FastAPI, uvicorn, SQLModel, openai-agents, MCP SDK (backend); Next.js 16, React 19, Better Auth (frontend)
**Storage**: External Neon PostgreSQL (unchanged from Phase III)
**Testing**: `helm lint`, `helm template --validate`, `kubectl apply --dry-run=client`, manual browser verification
**Target Platform**: Local Minikube cluster on Docker Desktop (Windows)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Pods ready within 120s, images build in < 5 minutes
**Constraints**: Minikube resources (2 CPU, 4GB RAM), external DB only, NodePort access
**Scale/Scope**: Single developer, 1 replica per service, local development only

## Constitution Check

*Constitution is template (unfilled). No gates to check. Proceeding with standard best practices.*

## Project Structure

### Documentation (this feature)

```text
specs/004-k8s-local-deploy/
├── plan.md              # This file
├── research.md          # Phase 0: technology research and decisions
├── data-model.md        # Phase 1: infrastructure entity model
├── quickstart.md        # Phase 1: deployment guide
├── contracts/
│   ├── helm-values.md   # Helm values.yaml schema
│   └── dockerfile-specs.md  # Dockerfile specifications
└── tasks.md             # Phase 2 output (created by /sp.tasks)
```

### Source Code (new files to create)

```text
backend/
├── Dockerfile           # Multi-stage Python build
└── .dockerignore        # Exclude venv, __pycache__, .env

frontend/
├── Dockerfile           # Multi-stage Node.js build
└── .dockerignore        # Exclude node_modules, .next, .env

helm/
└── todo-chatbot/
    ├── Chart.yaml       # Chart metadata
    ├── values.yaml      # Default configuration
    └── templates/
        ├── _helpers.tpl               # Template helpers
        ├── backend-deployment.yaml    # Backend Deployment
        ├── backend-service.yaml       # Backend Service (NodePort)
        ├── backend-configmap.yaml     # Backend non-sensitive config
        ├── backend-secret.yaml        # Backend secrets
        ├── frontend-deployment.yaml   # Frontend Deployment
        ├── frontend-service.yaml      # Frontend Service (NodePort)
        ├── frontend-configmap.yaml    # Frontend non-sensitive config
        └── frontend-secret.yaml       # Frontend secrets
```

### Existing files to modify

```text
backend/main.py          # Add CORS origin for Minikube frontend URL
frontend/next.config.ts  # Add output: "standalone" for optimized Docker build
```

**Structure Decision**: Follows existing web application layout (backend/ + frontend/). New `helm/` directory at repo root for Kubernetes packaging. No restructuring of existing code.

## Architecture

### Deployment Topology

```
┌──────────────────────────────────────────────────────────┐
│  Minikube Cluster                                         │
│                                                           │
│  ┌─────────────────────┐    ┌──────────────────────────┐ │
│  │  Frontend Pod        │    │  Backend Pod              │ │
│  │  ┌─────────────────┐ │    │  ┌────────────────────┐  │ │
│  │  │ Next.js 16      │ │    │  │ FastAPI + uvicorn   │  │ │
│  │  │ (standalone)    │ │    │  │ + MCP subprocess    │  │ │
│  │  └─────────────────┘ │    │  └────────────────────┘  │ │
│  │  Port: 3000          │    │  Port: 8000              │ │
│  └─────────┬───────────┘    └──────────┬───────────────┘ │
│            │                            │                  │
│  ┌─────────┴───────────┐    ┌──────────┴───────────────┐ │
│  │ Service (NodePort)  │    │ Service (NodePort)        │ │
│  │ 30300 → 3000       │    │ 30800 → 8000             │ │
│  └─────────┬───────────┘    └──────────┬───────────────┘ │
└────────────┼────────────────────────────┼─────────────────┘
             │                            │
    ┌────────┴────────────────────────────┴──────────┐
    │              Developer's Browser                │
    │  http://<minikube-ip>:30300  (frontend)        │
    │  http://<minikube-ip>:30800  (backend API)     │
    └────────────────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │  Neon PostgreSQL     │
              │  (external cloud)    │
              └─────────────────────┘
```

### Environment Variable Flow

```
Helm values.yaml
├── secrets → K8s Secret (base64)
│   ├── DATABASE_URL       → Both pods
│   ├── BETTER_AUTH_SECRET → Both pods
│   └── OPENAI_API_KEY     → Backend pod
├── backend.env → K8s ConfigMap
│   ├── BETTER_AUTH_URL = http://todo-chatbot-frontend:3000  (internal)
│   └── FRONTEND_URL = http://<minikube-ip>:30300           (external)
└── frontend.env → K8s ConfigMap
    └── BETTER_AUTH_URL = http://<minikube-ip>:30300         (external)

Build-time (Docker build args):
└── NEXT_PUBLIC_API_URL = http://<minikube-ip>:30800         (baked into JS)
```

### Key Design Decisions

1. **Both services use NodePort** (not ClusterIP for backend): The browser makes direct API calls to the backend. The backend must be reachable from outside the cluster. See [research.md](research.md#r3) for alternatives considered.

2. **NEXT_PUBLIC_API_URL is a build arg**: This Next.js variable is embedded at build time into the client JS bundle. It cannot be set at runtime via ConfigMap. The developer must build the frontend image with `--build-arg NEXT_PUBLIC_API_URL=http://<minikube-ip>:30800`. See [research.md](research.md#r2).

3. **Split BETTER_AUTH_URL**: Frontend uses the external NodePort URL (what the browser sees). Backend uses the internal service DNS (http://todo-chatbot-frontend:3000) for JWKS verification. See [research.md](research.md#r4).

4. **imagePullPolicy: Never**: Images are built inside Minikube's Docker daemon using `minikube docker-env`. No container registry needed.

5. **Next.js standalone output**: Adding `output: "standalone"` to next.config.ts produces a self-contained server without full node_modules, dramatically reducing image size.

## Implementation Phases

### Phase A: Dockerfiles (US-1)

1. Add `output: "standalone"` to `frontend/next.config.ts`
2. Create `backend/Dockerfile` (multi-stage: install deps → copy app)
3. Create `backend/.dockerignore`
4. Create `frontend/Dockerfile` (multi-stage: deps → build → runtime)
5. Create `frontend/.dockerignore`
6. Verify both images build and run with `docker run`

### Phase B: Helm Chart (US-2)

7. Create `helm/todo-chatbot/Chart.yaml`
8. Create `helm/todo-chatbot/values.yaml` with all defaults
9. Create `helm/todo-chatbot/templates/_helpers.tpl`
10. Create backend templates (deployment, service, configmap, secret)
11. Create frontend templates (deployment, service, configmap, secret)
12. Run `helm lint` and `helm template` to validate

### Phase C: Application Updates (US-3, US-4)

13. Update `backend/main.py` CORS to accept `FRONTEND_URL` env var (already partially done — verify)
14. Verify health check endpoint works in container context

### Phase D: Documentation (US-5)

15. Create quickstart guide with step-by-step Minikube deployment
16. Document AIOps tool usage (Gordon, kubectl-ai, kagent)

## Complexity Tracking

No constitution violations. The architecture is straightforward:
- 2 Dockerfiles (standard multi-stage)
- 1 Helm chart (single chart, no subcharts)
- 2 minor application changes (next.config.ts, CORS)
- No new application logic, no new endpoints, no new database tables

## Risks

1. **NEXT_PUBLIC_API_URL build-time coupling**: If the Minikube IP changes (cluster restart), the frontend image must be rebuilt. Mitigated by using `minikube docker-env` for fast rebuilds.
2. **MCP subprocess in container**: The chat agent spawns a Python subprocess. Must ensure the container's Python has all MCP dependencies. Mitigated by installing all requirements in a single virtual env.
3. **Windows-specific Docker/Minikube issues**: Paths, Docker daemon switching, and PowerShell syntax may differ. Mitigated by documenting Windows-specific commands in quickstart.
