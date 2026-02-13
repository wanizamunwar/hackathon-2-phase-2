# Quickstart: Local Kubernetes Deployment

**Feature**: 004-k8s-local-deploy
**Date**: 2026-02-14

## Prerequisites

1. **Docker Desktop** installed and running (v4.53+ for Gordon)
2. **Minikube** installed (`winget install minikube` or `choco install minikube`)
3. **Helm** installed (`winget install Helm.Helm` or `choco install kubernetes-helm`)
4. **kubectl** installed (bundled with Docker Desktop or Minikube)
5. Valid `.env` files with credentials (DATABASE_URL, OPENAI_API_KEY, BETTER_AUTH_SECRET)

## Step 1: Start Minikube

```powershell
# Note: Adjust --memory based on Docker Desktop's available memory
minikube start --cpus=2 --memory=3072 --driver=docker
```

Verify:
```powershell
minikube status
kubectl get nodes
```

## Step 2: Configure Docker to Use Minikube's Daemon

```powershell
# PowerShell
& minikube docker-env --shell powershell | Invoke-Expression

# Bash/Git Bash (alternative)
eval $(minikube docker-env)
```

This makes `docker build` build images directly inside Minikube (no transfer needed).

## Step 3: Build Container Images

```powershell
# Build backend (no build args needed — runtime env vars)
docker build -t todo-backend:latest ./backend

# Build frontend (NEXT_PUBLIC_API_URL is a build-time variable)
# Use localhost because on Windows Docker driver, minikube IP isn't directly reachable
docker build -t todo-frontend:latest `
  --build-arg NEXT_PUBLIC_API_URL="http://localhost:30800" `
  ./frontend
```

Verify images:
```powershell
docker images | Select-String "todo-"
```

## Step 4: Deploy with Helm

Create a `helm/values-local.yaml` with your secrets (this file is gitignored):

```yaml
backend:
  env:
    BETTER_AUTH_URL: "http://todo-chatbot-frontend:3000"
    FRONTEND_URL: "http://localhost:30300"
frontend:
  env:
    BETTER_AUTH_URL: "http://localhost:30300"
secrets:
  databaseUrl: "<your-neon-database-url>"
  betterAuthSecret: "<your-auth-secret>"
  openaiApiKey: "<your-openai-api-key>"
```

Then install:
```powershell
helm install todo-chatbot ./helm/todo-chatbot -f ./helm/values-local.yaml
```

## Step 5: Verify Deployment

```powershell
# Check pods are running (both should show 1/1 Ready within ~60s)
kubectl get pods

# Check services
kubectl get services

# Check pod logs
kubectl logs -l app=todo-backend --tail=20
kubectl logs -l app=todo-frontend --tail=20
```

## Step 6: Access the Application

On Windows with Docker driver, the Minikube IP isn't directly reachable. Use port-forwarding:

```powershell
# Start port-forwarding for both services (run in separate terminals)
kubectl port-forward svc/todo-chatbot-backend 30800:8000
kubectl port-forward svc/todo-chatbot-frontend 30300:3000
```

Then access:
- **Frontend**: http://localhost:30300
- **Backend Health**: http://localhost:30800/health

```powershell
# Verify backend health
curl http://localhost:30800/health
# Expected: {"status":"ok"}
```

## Cleanup

```powershell
# Uninstall the Helm release
helm uninstall todo-chatbot

# Stop Minikube
minikube stop

# Delete Minikube cluster (optional)
minikube delete
```

## AIOps Tools (Optional)

### Docker AI Agent (Gordon)
```powershell
# Check Gordon capabilities
docker ai "What can you do?"

# Ask Gordon to analyze our Dockerfile
docker ai "Analyze the backend/Dockerfile and suggest optimizations"

# Ask Gordon to help debug container issues
docker ai "Why is my container failing to start?"
```

**Note**: Gordon requires Docker Desktop 4.53+ with Beta features enabled. If unavailable in your region, use standard Docker CLI commands above.

### kubectl-ai
```powershell
# Deploy with natural language
kubectl-ai "check the status of all pods in default namespace"

# Debug issues
kubectl-ai "why are the todo-backend pods not ready?"

# Scale services
kubectl-ai "scale the backend to 2 replicas"
```

### Kagent
```powershell
# Cluster health analysis
kagent "analyze the cluster health"

# Resource optimization
kagent "optimize resource allocation for todo-chatbot pods"
```

## Troubleshooting

| Issue | Solution |
| ----- | -------- |
| Pods stuck in `ImagePullBackOff` | Ensure `imagePullPolicy: Never` and images were built with Minikube's Docker daemon |
| Frontend returns blank page | Check NEXT_PUBLIC_API_URL was set correctly at build time |
| Backend returns 401 errors | Verify BETTER_AUTH_URL points to frontend's internal service URL |
| Database connection errors | Check DATABASE_URL secret is correct and Neon is accessible from your network |
| NodePort not accessible | On Windows Docker driver, use `kubectl port-forward` instead of direct Minikube IP access |
| Minikube memory error | Reduce `--memory` to fit Docker Desktop's limit (check Docker Desktop > Settings > Resources) |
| curl timeout to Minikube IP | Minikube IP isn't routable on Windows Docker driver — use `kubectl port-forward` or `minikube service` |
| Port-forward drops after pod restart | Re-run `kubectl port-forward` — it doesn't reconnect automatically |
