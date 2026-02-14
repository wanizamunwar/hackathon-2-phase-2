# Research: Local Kubernetes Deployment

**Feature**: 004-k8s-local-deploy
**Date**: 2026-02-14

## R1: Container Strategy for Next.js 16 + FastAPI

### Decision: Multi-stage Docker builds with standalone Next.js output

**Rationale**:
- Next.js 16 supports `output: "standalone"` which produces a self-contained server (~30MB) without the full node_modules. This drastically reduces image size.
- FastAPI uses `python:3.12-slim` as base to minimize image size while keeping psycopg2-binary compatible.
- Multi-stage builds separate dependency installation from runtime, reducing final image layers.

**Alternatives considered**:
- Single-stage builds: Simpler but produce images 2-3x larger (includes dev dependencies, build tools).
- Alpine-based Python images: Smaller but `psycopg2-binary` has issues on Alpine (needs compilation from source).
- Distroless images: Even smaller but harder to debug and `sys.executable` subprocess (MCP server) may not work.

**Key finding**: The backend's MCP server uses `sys.executable` to spawn a subprocess. The Docker image must ensure the same Python interpreter is available and all dependencies are accessible to the subprocess.

## R2: NEXT_PUBLIC_ Environment Variables in Kubernetes

### Decision: Build-time injection via Docker build args

**Rationale**:
- `NEXT_PUBLIC_API_URL` is embedded at build time into the JS bundle by Next.js. It cannot be overridden at runtime via ConfigMap/Secret.
- For Minikube, the developer builds the frontend image with `--build-arg NEXT_PUBLIC_API_URL=http://<minikube-ip>:<nodeport>`.
- Alternative: Use `minikube docker-env` to build inside Minikube's Docker daemon, avoiding image transfer.

**Alternatives considered**:
- Runtime replacement script (sed on built JS files at startup): Fragile, version-dependent.
- Next.js `publicRuntimeConfig`: Deprecated in App Router; doesn't work with `NEXT_PUBLIC_` prefix.
- Server-side proxy in Next.js: Would require code changes to the frontend application (out of scope).

## R3: Kubernetes Networking for Browser-to-Backend Communication

### Decision: Both services use NodePort for external access

**Rationale**:
- The frontend serves a single-page application to the browser. The browser makes direct API calls to the backend using `NEXT_PUBLIC_API_URL`.
- This means the backend MUST be reachable from outside the cluster (from the browser), not just internally.
- NodePort services provide both internal ClusterIP and external NodePort access.
- Using ClusterIP-only for the backend would make it unreachable from the browser.

**Port allocation**:
- Frontend: NodePort 30300 (maps to container port 3000)
- Backend: NodePort 30800 (maps to container port 8000)

**Alternatives considered**:
- Backend as ClusterIP + Ingress controller: More production-like but Ingress is out of scope for local dev.
- Backend as ClusterIP + frontend API proxy: Would require frontend code changes (new API routes to proxy requests).
- LoadBalancer + minikube tunnel: Works but tunnel must run continuously and can be flaky on Windows.

## R4: Auth URL Configuration in Kubernetes

### Decision: Split BETTER_AUTH_URL between frontend (external) and backend (internal)

**Rationale**:
- Frontend's `BETTER_AUTH_URL`: Must match what the browser sees (the NodePort URL) because Better Auth uses it for baseURL, trustedOrigins, and JWT issuer.
- Backend's `BETTER_AUTH_URL`: Used to fetch JWKS from the frontend for JWT verification. Since the backend pod is in the same cluster, it can use the internal service DNS: `http://todo-chatbot-frontend:3000`.
- Backend's `FRONTEND_URL`: Used for CORS allowed origins. Must match what the browser sends as `Origin` header, which is the external NodePort URL.

**Implications**:
- Two different URLs for the "same" service depending on who's calling.
- ConfigMap/values.yaml must clearly separate internal vs external URLs.

## R5: Helm Chart Structure

### Decision: Single umbrella chart with templates for both services

**Rationale**:
- The application has only 2 services. A single chart with grouped templates (frontend-deployment.yaml, backend-deployment.yaml, etc.) is simpler than subcharts.
- All values in a single values.yaml for easy configuration.
- `helm install todo-chatbot ./helm/todo-chatbot` deploys everything.

**Chart structure**:
```
helm/todo-chatbot/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── _helpers.tpl
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── backend-configmap.yaml
    ├── backend-secret.yaml
    ├── frontend-deployment.yaml
    ├── frontend-service.yaml
    ├── frontend-configmap.yaml
    └── frontend-secret.yaml
```

**Alternatives considered**:
- Subchart per service: More modular but overkill for 2 services, adds chart dependency complexity.
- Kustomize instead of Helm: Less templating power, no `values.yaml` override mechanism.
- Raw manifests with kubectl: No parameterization, hard to customize per environment.

## R6: Image Loading into Minikube

### Decision: Use `minikube image build` or `minikube docker-env`

**Rationale**:
- `minikube docker-env` points the local Docker CLI to Minikube's Docker daemon. Images built with this active are immediately available to Minikube without transfer.
- Alternative: `minikube image load <image>` transfers a local image into Minikube but is slower for large images.
- Setting `imagePullPolicy: Never` in Helm chart prevents Kubernetes from trying to pull from a registry.

**Windows considerations**:
- PowerShell: `& minikube docker-env --shell powershell | Invoke-Expression`
- CMD: `@FOR /f "tokens=*" %i IN ('minikube docker-env --shell cmd') DO @%i`

## R7: Health Check Strategy

### Decision: Use existing `/health` endpoint for backend; root `/` for frontend

**Rationale**:
- Backend already has `GET /health` returning `{"status": "ok"}` — use as both liveness and readiness probe.
- Frontend serves pages on `/` — an HTTP 200 on root indicates the server is running and ready.
- Liveness probes: Detect if the process is alive. Restart on failure.
- Readiness probes: Detect if the service can handle traffic. Same endpoints but with initial delay for startup.

**Probe configuration**:
- Backend: `httpGet /health`, initialDelay 10s, period 15s, failure threshold 3
- Frontend: `httpGet /`, initialDelay 15s, period 15s, failure threshold 3

## R8: Resource Limits

### Decision: Conservative defaults suitable for Minikube

**Rationale**:
- Minikube typically has 2-4 CPU and 4-8GB RAM. Resources must be conservative.
- Backend (FastAPI/uvicorn): Low CPU usage, moderate memory for Python runtime.
- Frontend (Next.js/Node): Moderate CPU for SSR, moderate memory.

**Defaults**:
| Service  | CPU Request | CPU Limit | Memory Request | Memory Limit |
| -------- | ----------- | --------- | -------------- | ------------ |
| Backend  | 100m        | 500m      | 128Mi          | 512Mi        |
| Frontend | 100m        | 500m      | 128Mi          | 512Mi        |

**Note**: These are overridable via `values.yaml`.
