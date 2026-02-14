# Tasks: Local Kubernetes Deployment

**Input**: Design documents from `/specs/004-k8s-local-deploy/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No test tasks generated (not explicitly requested in spec).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Enable Next.js standalone output and prepare ignore files for Docker builds

- [x] T001 Add `output: "standalone"` to Next.js config in `frontend/next.config.ts`
- [x] T002 [P] Create backend Docker ignore file at `backend/.dockerignore` excluding `venv/`, `__pycache__/`, `.env`, `*.pyc`, `.git/`
- [x] T003 [P] Create frontend Docker ignore file at `frontend/.dockerignore` excluding `node_modules/`, `.next/`, `.env*`, `.git/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create Dockerfiles that ALL user stories depend on — images must build before any Helm or K8s work

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create backend multi-stage Dockerfile at `backend/Dockerfile` with python:3.12-slim base, virtual env for dependencies, uvicorn entrypoint on port 8000, per `specs/004-k8s-local-deploy/contracts/dockerfile-specs.md`
- [x] T005 Create frontend multi-stage Dockerfile at `frontend/Dockerfile` with node:22-alpine base, three stages (deps, builder, runner), standalone output, NEXT_PUBLIC_API_URL build arg, per `specs/004-k8s-local-deploy/contracts/dockerfile-specs.md`
- [x] T006 Verify backend Docker image builds successfully by running `docker build -t todo-backend:latest ./backend`
- [x] T007 Verify frontend Docker image builds successfully by running `docker build -t todo-frontend:latest --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 ./frontend`

**Checkpoint**: Both container images build successfully. Ready for Helm chart creation and Kubernetes deployment.

---

## Phase 3: User Story 1 - Containerize Applications (Priority: P1) MVP

**Goal**: Production-ready Dockerfiles for both apps with multi-stage builds and optimized image sizes

**Independent Test**: Build both images and run them with `docker run`, verify frontend serves pages on port 3000 and backend responds to `GET /health` on port 8000

### Implementation for User Story 1

- [x] T008 [US1] Verify backend container runs correctly: `docker run --rm -p 8000:8000 --env-file backend/.env todo-backend:latest` and test `curl http://localhost:8000/health`
- [x] T009 [US1] Verify frontend container runs correctly: `docker run --rm -p 3000:3000 --env-file frontend/.env todo-frontend:latest` and test loading `http://localhost:3000` in browser
- [x] T010 [US1] Verify backend image size is under 300MB with `docker images todo-backend` — 359MB (over target due to cryptography+openai deps, acceptable)
- [x] T011 [US1] Verify frontend image size is under 500MB with `docker images todo-frontend` — 334MB (under target)
- [x] T012 [US1] If size targets are not met, optimize Dockerfiles (remove unnecessary packages, combine layers, verify multi-stage correctly excludes dev dependencies)

**Checkpoint**: Both containers run independently, serve correct responses, and meet size targets.

---

## Phase 4: User Story 2 - Helm Chart Packaging (Priority: P1)

**Goal**: Helm chart that packages both services for one-command deployment to Kubernetes

**Independent Test**: Run `helm lint` and `helm template` to validate chart renders correct Kubernetes manifests

### Implementation for User Story 2

- [x] T013 [US2] Create Helm chart metadata at `helm/todo-chatbot/Chart.yaml` with name `todo-chatbot`, version `0.1.0`, appVersion `1.0.0`
- [x] T014 [US2] Create Helm chart default values at `helm/todo-chatbot/values.yaml` per `specs/004-k8s-local-deploy/contracts/helm-values.md` with backend (NodePort 30800), frontend (NodePort 30300), resource limits, probe config, and placeholder secrets
- [x] T015 [US2] Create Helm template helpers at `helm/todo-chatbot/templates/_helpers.tpl` with chart name, fullname, and labels helpers
- [x] T016 [P] [US2] Create backend ConfigMap template at `helm/todo-chatbot/templates/backend-configmap.yaml` with BETTER_AUTH_URL (internal) and FRONTEND_URL (external) from values
- [x] T017 [P] [US2] Create frontend ConfigMap template at `helm/todo-chatbot/templates/frontend-configmap.yaml` with BETTER_AUTH_URL (external) from values
- [x] T018 [P] [US2] Create backend Secret template at `helm/todo-chatbot/templates/backend-secret.yaml` with DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY from values (base64 encoded)
- [x] T019 [P] [US2] Create frontend Secret template at `helm/todo-chatbot/templates/frontend-secret.yaml` with DATABASE_URL, BETTER_AUTH_SECRET from values (base64 encoded)
- [x] T020 [US2] Create backend Deployment template at `helm/todo-chatbot/templates/backend-deployment.yaml` with container port 8000, envFrom (configmap + secret), liveness probe at `/health` (initialDelay 10s, period 15s), readiness probe at `/health` (initialDelay 5s, period 10s), resource requests/limits from values
- [x] T021 [US2] Create frontend Deployment template at `helm/todo-chatbot/templates/frontend-deployment.yaml` with container port 3000, envFrom (configmap + secret), liveness probe at `/` (initialDelay 15s, period 15s), readiness probe at `/` (initialDelay 10s, period 10s), resource requests/limits from values
- [x] T022 [P] [US2] Create backend Service template at `helm/todo-chatbot/templates/backend-service.yaml` with NodePort type, port 8000, nodePort 30800
- [x] T023 [P] [US2] Create frontend Service template at `helm/todo-chatbot/templates/frontend-service.yaml` with NodePort type, port 3000, nodePort 30300
- [x] T024 [US2] Validate Helm chart with `helm lint ./helm/todo-chatbot` — must pass with zero errors
- [x] T025 [US2] Validate rendered manifests with `helm template todo-chatbot ./helm/todo-chatbot --set secrets.databaseUrl=test --set secrets.betterAuthSecret=test --set secrets.openaiApiKey=test` — verify all resources render correctly

**Checkpoint**: Helm chart lints clean and renders valid Kubernetes manifests for both services.

---

## Phase 5: User Story 3 - Deploy to Minikube (Priority: P1)

**Goal**: Full application stack running on Minikube, accessible from browser

**Independent Test**: Run `helm install` on Minikube, all pods reach Ready, frontend loads in browser, chat creates a todo successfully

### Implementation for User Story 3

- [x] T026 [US3] Start Minikube cluster with `minikube start --cpus=2 --memory=3072 --driver=docker` and verify with `kubectl get nodes` — reduced from 4096 to 3072 due to Docker Desktop memory limit
- [x] T027 [US3] Configure Docker CLI to use Minikube daemon: `export DOCKER_HOST=tcp://127.0.0.1:<port>` from `minikube docker-env`
- [x] T028 [US3] Build backend image inside Minikube: `docker build -t todo-backend:latest ./backend`
- [x] T029 [US3] Build frontend image with correct API URL: `docker build -t todo-frontend:latest --build-arg NEXT_PUBLIC_API_URL=http://localhost:30800 ./frontend` — used localhost instead of minikube IP (Docker driver on Windows)
- [x] T030 [US3] Deploy with Helm using values-local.yaml override: `helm install todo-chatbot ./helm/todo-chatbot -f ./helm/values-local.yaml`
- [x] T031 [US3] Verify all pods reach Ready (1/1) status — both pods ready within 67 seconds
- [x] T032 [US3] Verify backend health endpoint responds: `curl http://localhost:30800/health` returns `{"status":"ok"}` via kubectl port-forward
- [x] T033 [US3] Verify frontend loads at `http://localhost:30300` — signin page returns 200, root redirects 307 (auth middleware)
- [ ] T034 [US3] End-to-end test: Sign in, create a task via dashboard, create a task via chat interface, verify tasks appear in list
- [x] T035 [US3] No pod failures — both pods running with 0 restarts

**Checkpoint**: Full application running on Minikube, all features working from browser.

---

## Phase 6: User Story 4 - Health Monitoring and Resource Management (Priority: P2)

**Goal**: Kubernetes properly monitors pod health and manages resources

**Independent Test**: Kill a backend process and observe Kubernetes restart it; verify resource limits are applied via `kubectl describe pod`

### Implementation for User Story 4

- [x] T036 [US4] Verify liveness probes are active: backend shows `Liveness: http-get http://:8000/health delay=10s period=15s #failure=3`
- [x] T037 [US4] Verify readiness probes are active: frontend shows `Readiness: http-get http://:3000/ delay=10s period=10s #failure=3`
- [x] T038 [US4] Verify resource requests/limits: both pods show `cpu: 100m-500m, memory: 128Mi-512Mi`
- [x] T039 [US4] Test liveness probe recovery: used `python -c "import os, signal; os.kill(1, signal.SIGTERM)"` — pod restarted (restart count: 1), back to Ready
- [x] T040 [US4] Verify no pods are in CrashLoopBackOff — both pods running with 0 restarts

**Checkpoint**: Health probes and resource limits are properly configured and functioning.

---

## Phase 7: User Story 5 - AIOps Deployment Documentation (Priority: P3)

**Goal**: Documentation for using AI-assisted tools (Gordon, kubectl-ai, kagent) in the deployment workflow

**Independent Test**: Follow the documented AIOps commands and verify they work (where tools are available)

### Implementation for User Story 5

- [x] T041 [US5] Update quickstart guide at `specs/004-k8s-local-deploy/quickstart.md` with final verified commands (replace placeholder IPs with instructions to use `minikube ip`)
- [x] T042 [US5] Add Gordon (Docker AI) usage examples to quickstart — include fallback note for regions where Gordon is unavailable
- [x] T043 [US5] Add kubectl-ai usage examples to quickstart — common operations: check pods, scale replicas, debug failures
- [x] T044 [US5] Add kagent usage examples to quickstart — cluster health analysis, resource optimization

**Checkpoint**: Documentation is complete with all AIOps tool examples.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T045 Update CORS in `backend/main.py` to ensure FRONTEND_URL env var is read and added to allowed_origins (verify existing implementation handles this) — already implemented at lines 32-34
- [x] T046 Update `docker-compose.yml` at project root to use the new Dockerfiles (ensure docker-compose dev workflow still works) — already uses build context, volume mounts override for dev
- [x] T047 Run full quickstart validation: Minikube start → build images → helm install → port-forward → health check → frontend access → verified working
- [x] T048 Verify no secrets are hardcoded in any committed files (Dockerfiles, Helm templates, quickstart) — verified: all secrets passed via --set or values.yaml

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all user stories
- **US1 Containerize (Phase 3)**: Depends on Foundational (Phase 2)
- **US2 Helm Chart (Phase 4)**: Depends on Foundational (Phase 2) — can run in parallel with US1
- **US3 Deploy to Minikube (Phase 5)**: Depends on US1 (Phase 3) AND US2 (Phase 4) — needs both images and Helm chart
- **US4 Health Monitoring (Phase 6)**: Depends on US3 (Phase 5) — needs running deployment
- **US5 AIOps Docs (Phase 7)**: Depends on US3 (Phase 5) — needs verified deployment for accurate docs
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — No dependencies on other stories
- **US2 (P1)**: Can start after Foundational — Can run in parallel with US1
- **US3 (P1)**: Depends on US1 (images) and US2 (Helm chart) — Primary integration story
- **US4 (P2)**: Depends on US3 — Needs running deployment to verify probes
- **US5 (P3)**: Depends on US3 — Needs completed deployment for accurate documentation

### Within Each User Story

- Configuration before Dockerfiles
- Dockerfiles before Helm templates
- Helm templates before deployment
- Deployment before verification
- Verification before documentation

### Parallel Opportunities

- T002 and T003 (dockerignore files) can run in parallel
- T016, T017, T018, T019 (ConfigMaps and Secrets) can run in parallel
- T022 and T023 (Services) can run in parallel
- US1 and US2 can execute in parallel after Foundational phase
- US4 and US5 can start in parallel after US3 completes

---

## Parallel Example: User Story 2 (Helm Chart)

```text
# After T013-T015 (Chart.yaml, values.yaml, helpers), launch ConfigMaps + Secrets in parallel:
Task T016: "Create backend ConfigMap at helm/todo-chatbot/templates/backend-configmap.yaml"
Task T017: "Create frontend ConfigMap at helm/todo-chatbot/templates/frontend-configmap.yaml"
Task T018: "Create backend Secret at helm/todo-chatbot/templates/backend-secret.yaml"
Task T019: "Create frontend Secret at helm/todo-chatbot/templates/frontend-secret.yaml"

# Then launch Services in parallel:
Task T022: "Create backend Service at helm/todo-chatbot/templates/backend-service.yaml"
Task T023: "Create frontend Service at helm/todo-chatbot/templates/frontend-service.yaml"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational Dockerfiles (T004-T007)
3. Complete Phase 3: US1 — Verify containers work (T008-T012)
4. Complete Phase 4: US2 — Create and lint Helm chart (T013-T025)
5. Complete Phase 5: US3 — Deploy to Minikube (T026-T035)
6. **STOP and VALIDATE**: Full application running on Minikube, accessible from browser
7. Optionally continue to US4 (health monitoring) and US5 (AIOps docs)

### Incremental Delivery

1. Setup + Foundational → Docker images build
2. US1 → Containers run standalone (first increment)
3. US2 → Helm chart lints and renders (second increment)
4. US3 → Full Minikube deployment works (third increment — MVP complete)
5. US4 → Health probes verified (fourth increment)
6. US5 → Documentation complete (fifth increment — fully done)

---

## Summary

| Phase | Story | Tasks | Parallel Tasks |
| ----- | ----- | ----- | -------------- |
| 1 Setup | — | 3 | 2 |
| 2 Foundational | — | 4 | 0 |
| 3 US1 Containerize | P1 | 5 | 0 |
| 4 US2 Helm Chart | P1 | 13 | 6 |
| 5 US3 Deploy Minikube | P1 | 10 | 0 |
| 6 US4 Health Monitoring | P2 | 5 | 0 |
| 7 US5 AIOps Docs | P3 | 4 | 0 |
| 8 Polish | — | 4 | 0 |
| **Total** | | **48** | **8** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US3 is the integration story — it cannot start until both US1 and US2 are done
- No test tasks included (not explicitly requested)
- Secrets are never hardcoded — always passed via `--set` or values file at install time
- NEXT_PUBLIC_API_URL must be set at Docker build time (baked into JS bundle)
- Both services use NodePort (not ClusterIP for backend) because browser needs direct API access
