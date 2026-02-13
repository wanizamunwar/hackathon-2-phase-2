---
id: 2
title: Create K8s Implementation Plan
stage: plan
date: 2026-02-14
surface: agent
model: claude-opus-4-6
feature: 004-k8s-local-deploy
branch: 004-k8s-local-deploy
user: waniza
command: /sp.plan
labels: ["kubernetes", "docker", "helm", "minikube", "architecture"]
links:
  spec: specs/004-k8s-local-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-k8s-local-deploy/plan.md
  - specs/004-k8s-local-deploy/research.md
  - specs/004-k8s-local-deploy/data-model.md
  - specs/004-k8s-local-deploy/quickstart.md
  - specs/004-k8s-local-deploy/contracts/helm-values.md
  - specs/004-k8s-local-deploy/contracts/dockerfile-specs.md
tests:
  - Plan template validation (all sections filled)
  - Research decisions documented with rationale and alternatives
---

## Prompt

/sp.plan

## Response snapshot

Created implementation plan for Phase IV: Local Kubernetes Deployment. Generated 6 artifacts:
- **plan.md**: Full implementation plan with 4 phases (A-D), deployment topology diagram, environment variable flow, 5 key design decisions, 3 risks identified.
- **research.md**: 8 research decisions covering container strategy, NEXT_PUBLIC env vars, K8s networking, auth URL split, Helm chart structure, image loading, health checks, and resource limits.
- **data-model.md**: Infrastructure entity model (no new app entities), K8s resource relationships.
- **quickstart.md**: Step-by-step Minikube deployment guide with Windows PowerShell commands, AIOps tool examples, troubleshooting table.
- **contracts/helm-values.md**: Complete Helm values.yaml schema with override examples.
- **contracts/dockerfile-specs.md**: Dockerfile specifications for both frontend and backend with build stages, args, and size targets.

Key architectural decisions: (1) Both services use NodePort for browser access, (2) NEXT_PUBLIC_API_URL injected at build time, (3) Split BETTER_AUTH_URL for internal vs external, (4) imagePullPolicy: Never with minikube docker-env, (5) Next.js standalone output for smaller images.

## Outcome

- ✅ Impact: Complete implementation plan with all Phase 0 and Phase 1 artifacts generated
- 🧪 Tests: Plan template validation passed, all sections filled
- 📁 Files: 6 files created (plan.md, research.md, data-model.md, quickstart.md, 2 contracts)
- 🔁 Next prompts: /sp.tasks to break plan into implementation tasks
- 🧠 Reflection: NEXT_PUBLIC_API_URL build-time coupling is the trickiest aspect. The split BETTER_AUTH_URL pattern (internal for JWKS, external for browser) is non-obvious but well documented.

## Evaluation notes (flywheel)

- Failure modes observed: None — existing codebase was well-structured with clear env var patterns
- Graders run and results (PASS/FAIL): Plan completeness PASS, Research coverage PASS, Contract clarity PASS
- Prompt variant (if applicable): Standard /sp.plan with empty user input (auto-detected feature context)
- Next experiment (smallest change to try): Proceed with /sp.tasks for task generation
