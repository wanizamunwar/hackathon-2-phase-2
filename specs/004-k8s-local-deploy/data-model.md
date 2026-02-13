# Data Model: Local Kubernetes Deployment

**Feature**: 004-k8s-local-deploy
**Date**: 2026-02-14

## Overview

Phase IV introduces no new application data entities. The existing Task, Conversation, and Message models from Phase III remain unchanged. The data model for this phase covers Kubernetes resource objects and Docker artifacts.

## Infrastructure Entities

### Container Image (Docker)

| Attribute        | Description                                        |
| ---------------- | -------------------------------------------------- |
| Name             | Image name (e.g., `todo-frontend`, `todo-backend`) |
| Tag              | Version tag (e.g., `latest`, `v1.0.0`)             |
| Base Image       | Parent image (python:3.12-slim, node:22-alpine)    |
| Exposed Port     | Container port (3000 for frontend, 8000 for backend) |
| Build Context    | Directory path (`./frontend`, `./backend`)         |
| Build Args       | Build-time variables (NEXT_PUBLIC_API_URL)          |

### Helm Values (Configuration)

| Attribute               | Type   | Description                                      |
| ----------------------- | ------ | ------------------------------------------------ |
| backend.replicaCount    | int    | Number of backend pod replicas                   |
| backend.image.repository| string | Backend container image name                     |
| backend.image.tag       | string | Backend image tag                                |
| backend.service.port    | int    | Backend service port (8000)                      |
| backend.service.nodePort| int    | Backend NodePort (30800)                         |
| backend.resources       | object | CPU/memory requests and limits                   |
| frontend.replicaCount   | int    | Number of frontend pod replicas                  |
| frontend.image.repository| string | Frontend container image name                   |
| frontend.image.tag      | string | Frontend image tag                               |
| frontend.service.port   | int    | Frontend service port (3000)                     |
| frontend.service.nodePort| int   | Frontend NodePort (30300)                        |
| frontend.resources      | object | CPU/memory requests and limits                   |

### Kubernetes Secret

| Key                | Description                         | Used By  |
| ------------------ | ----------------------------------- | -------- |
| DATABASE_URL       | Neon PostgreSQL connection string    | Both     |
| BETTER_AUTH_SECRET | Shared auth secret key              | Both     |
| OPENAI_API_KEY     | OpenAI API key for chatbot          | Backend  |

### Kubernetes ConfigMap

| Key                     | Description                                 | Used By  |
| ----------------------- | ------------------------------------------- | -------- |
| BETTER_AUTH_URL         | Frontend external URL (for auth)            | Frontend |
| BACKEND_BETTER_AUTH_URL | Internal frontend URL (for JWKS verification)| Backend |
| FRONTEND_URL            | Frontend external URL (for CORS)            | Backend  |

## Relationships

```
Helm Chart (values.yaml)
├── Backend Deployment
│   ├── Container Image (todo-backend)
│   ├── ConfigMap (backend config)
│   ├── Secret (shared secrets)
│   └── Service (NodePort 30800)
└── Frontend Deployment
    ├── Container Image (todo-frontend)
    ├── ConfigMap (frontend config)
    ├── Secret (shared secrets)
    └── Service (NodePort 30300)

External Dependency:
└── Neon PostgreSQL (no K8s resource — external)
```

## Existing Application Entities (Unchanged)

These entities from Phase II/III are NOT modified. They are stored in the external Neon PostgreSQL database.

- **Task**: id, user_id, title, description, completed, priority, tags, created_at, updated_at
- **Conversation**: id, user_id, created_at, updated_at
- **Message**: id, user_id, conversation_id, role, content, created_at
- **User** (Better Auth managed): id, email, name, emailVerified, image, createdAt, updatedAt
- **Session** (Better Auth managed): id, userId, token, expiresAt, ipAddress, userAgent
