# Helm Values Contract

**Feature**: 004-k8s-local-deploy
**Date**: 2026-02-14

## values.yaml Schema

```yaml
# Backend configuration
backend:
  replicaCount: 1
  image:
    repository: todo-backend
    tag: latest
    pullPolicy: Never          # Never pull — images built locally
  service:
    type: NodePort
    port: 8000                 # Container port
    nodePort: 30800            # External NodePort
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
  probes:
    liveness:
      path: /health
      initialDelaySeconds: 10
      periodSeconds: 15
      failureThreshold: 3
    readiness:
      path: /health
      initialDelaySeconds: 5
      periodSeconds: 10
      failureThreshold: 3
  env:
    BETTER_AUTH_URL: "http://todo-chatbot-frontend:3000"   # Internal URL for JWKS
    FRONTEND_URL: ""           # Set at install time: http://<minikube-ip>:30300

# Frontend configuration
frontend:
  replicaCount: 1
  image:
    repository: todo-frontend
    tag: latest
    pullPolicy: Never
  service:
    type: NodePort
    port: 3000
    nodePort: 30300
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
  probes:
    liveness:
      path: /
      initialDelaySeconds: 15
      periodSeconds: 15
      failureThreshold: 3
    readiness:
      path: /
      initialDelaySeconds: 10
      periodSeconds: 10
      failureThreshold: 3
  env:
    BETTER_AUTH_URL: ""        # Set at install time: http://<minikube-ip>:30300

# Shared secrets (base64 encoded in Secret resource)
secrets:
  databaseUrl: ""              # Required: Neon PostgreSQL connection string
  betterAuthSecret: ""         # Required: Shared auth secret
  openaiApiKey: ""             # Required: OpenAI API key
```

## Override Examples

### Minimal install (secrets only)
```bash
helm install todo-chatbot ./helm/todo-chatbot \
  --set secrets.databaseUrl="<connection-string>" \
  --set secrets.betterAuthSecret="<secret>" \
  --set secrets.openaiApiKey="<key>" \
  --set frontend.env.BETTER_AUTH_URL="http://$(minikube ip):30300" \
  --set backend.env.FRONTEND_URL="http://$(minikube ip):30300"
```

### Custom replicas and resources
```bash
helm install todo-chatbot ./helm/todo-chatbot \
  -f my-values.yaml \
  --set backend.replicaCount=2 \
  --set backend.resources.limits.memory=1Gi
```
