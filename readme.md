# RLaaS — Rate Limiting as a Service

RLaaS is a centralized rate-limiting service that provides configurable, per-application request-rate control through an authenticated API. It combines API-key authentication, flexible rate-limit policy management, multiple rate-limiting algorithms, Redis-backed runtime state, MongoDB persistence, and a web-based management console.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Deployment Architecture](#deployment-architecture)
3. [Authentication Architecture](#authentication-architecture)
4. [Authorization Model](#authorization-model)
5. [API Endpoints](#api-endpoints)
6. [Rate-Limiting Algorithms](#rate-limiting-algorithms)
7. [Redis Architecture](#redis-architecture)
8. [MongoDB Schema](#mongodb-schema)
9. [Technology Stack](#technology-stack)
10. [Frontend & Dashboard](#frontend--dashboard)
11. [Project Structure](#project-structure)
12. [Setup](#setup)
13. [Deployment Guide](#deployment-guide)
14. [Security Considerations](#security-considerations)
15. [Testing](#testing)
16. [Engineering Trade-offs](#engineering-trade-offs)
17. [Current Limitations](#current-limitations)
18. [Future Engineering Roadmap](#future-engineering-roadmap)
19. [Project Status](#project-status)

---

## Architecture

```
                         Client Application
                                |
                                | X-API-Key
                                v
                       +-------------------+
                       |     RLaaS API     |
                       |      FastAPI      |
                       +---------+---------+
                                 |
              +------------------+------------------+
              |                  |                  |
              v                  v                  v
       Authentication      Rule Resolution      Statistics
              |                  |                  |
              v                  v                  v
       Application ID        MongoDB               Redis
                                 |
                                 v
                         Algorithm Factory
                                 |
                    +------------+------------+
                    |            |            |
                    v            v            v
              Fixed Window  Sliding Window  Token Bucket
                    |            |            |
                    +------------+------------+
                                 |
                                 v
                            ALLOW / BLOCK
```

Requests arrive at the FastAPI service with an `X-API-Key` header. The API authenticates the request, resolves the applicable rate-limit rule from MongoDB, and dispatches it to the appropriate algorithm implementation via an algorithm factory. Runtime counters live in Redis; the final decision is either `ALLOW` or `BLOCK`.

## Deployment Architecture

```
                         Internet
                            |
                +-----------+-----------+
                |                       |
                v                       v
          +-----------+            +-----------+
          |  Netlify  |            |  Render   |
          | React UI  |            | FastAPI   |
          +-----------+            +-----+-----+
                                         |
                              +----------+----------+
                              |                     |
                              v                     v
                       +-------------+        +-------------+
                       | MongoDB     |        | Redis       |
                       | Atlas       |        |             |
                       +-------------+        +-------------+
```

The frontend communicates with the backend API exclusively over HTTPS. MongoDB and Redis are backend infrastructure and are never exposed directly to the browser.

---

## Authentication Architecture

RLaaS uses API-key authentication to identify client applications.

```
Client
  |
  | X-API-Key
  v
Authentication
  |
  v
API Key Validation
  |
  +---- Invalid ----> 401
  |
  +---- Expired ----> 401
  |
  +---- Revoked ----> 401
  |
  +---- Valid
          |
          v
       app_id
          |
          v
    Protected Endpoint
```

A valid API key resolves to the corresponding application. The `/auth-test` endpoint verifies authentication and returns the authenticated application's identity:

```json
{
  "authenticated": true,
  "app_id": "app_xxxxx",
  "application_name": "Example Application"
}
```

**API-key lifecycle:**
- Creation
- Authentication
- Expiration
- Revocation
- Rotation

Raw API keys are not exposed unnecessarily, and persisted API-key material is stored as a hash.

## Authorization Model

Authentication identifies the application; authorization determines which resources that application can access.

```
X-API-Key
    |
    v
Authentication
    |
    v
Authenticated app_id
    |
    v
Application-scoped operation
```

Application resources such as rules and statistics are scoped to the authenticated application. The backend never relies on a client-provided application ID to establish resource ownership — the authenticated `app_id` always wins.

---

## API Endpoints

### Health

```
GET /
```
Returns service status:
```json
{
  "status": "System is Running Successfully"
}
```

### Authentication

```
GET /auth-test
```
Required header: `X-API-Key: <api-key>`

```json
{
  "authenticated": true,
  "app_id": "app_xxxxx",
  "application_name": "Example Application"
}
```

### Rate Limiter

```
POST /rate-limiter
```
Required header: `X-API-Key: <api-key>`

Request processing flow:
```
POST /rate-limiter
        |
        v
   Authenticate
        |
        v
   Resolve Rule
        |
        v
 Algorithm Factory
        |
        v
 Evaluate Request
        |
        +--------+
        |        |
        v        v
      ALLOW    BLOCK
```

### Applications

```
POST /apps/
POST /apps/rotate-key
POST /apps/revoke-key
```
Manage application registration and API-key lifecycle operations.

### Rules

```
POST   /rules/
GET    /rules/
GET    /rules/{rule_id}
PUT    /rules/{rule_id}
PATCH  /rules/{rule_id}
DELETE /rules/{rule_id}
POST   /rules/bulk
```
Rules are scoped to the authenticated application.

### Statistics

```
GET /stats
```
Returns application-wide request statistics:
```json
{
  "app_id": "app_xxxxx",
  "total": 14,
  "allowed": 10,
  "blocked": 4,
  "block_rate": 28.57
}
```

---

## Rate-Limiting Algorithms

RLaaS separates rate-limit policy configuration from algorithm implementation. A rule specifies the algorithm and its configuration; the algorithm factory instantiates the corresponding limiter.

```
Rule
 |
 +-- Algorithm
 |
 +-- Configuration
 |
 v
Algorithm Factory
 |
 +------------+-------------+
 |            |             |
 v            v             v
Fixed       Sliding       Token
Window      Window        Bucket
```

### Fixed Window
Divides time into fixed intervals (e.g. limit: 10 requests, window: 60 seconds). Requests are counted within the current window; the counter resets once the window expires.

### Sliding Window
Evaluates requests against a moving time interval rather than a hard boundary:
```
                 NOW
                  |
                  v
        <---------|
            60 sec
```
This provides smoother enforcement around window boundaries than a fixed window.

### Token Bucket
Maintains a bucket of available tokens, replenished over time:
```
              Token Refill
                   |
                   v
            +-------------+
            |   BUCKET    |
            | o o o o o   |
            +------+------+
                   |
                   v
                Request
                   |
             Token available?
                /       \
              YES        NO
               |          |
               v          v
             ALLOW      BLOCK
```
Each accepted request consumes a token, allowing controlled bursts while maintaining a configured overall request rate.

---

## Redis Architecture

Rate limiting is a hot-path operation, so runtime counters and algorithm state are kept in Redis rather than MongoDB, decoupling enforcement latency from the persistent configuration store.

```
Request
   |
   v
Rate Limiter
   |
   v
Redis
   |
   +-- Rate-limit state
   |
   +-- Allowed counters
   |
   +-- Blocked counters
   |
   +-- Statistics
```

Statistics keys are scoped by application and request characteristics:

```
stats:{app_id}:{user_id}:{method}:{resource}:allowed
stats:{app_id}:{user_id}:{method}:{resource}:blocked
```

Application-wide statistics aggregate the relevant counters for the authenticated application. Redis is the runtime state layer; MongoDB is the persistent configuration layer.

---

## MongoDB Schema

MongoDB stores persistent application and rate-limit configuration across two primary collections.

### `applications`

```json
{
  "app_id": "app_xxxxx",
  "name": "Example Application",
  "api_key_hash": "<hashed-key>",
  "api_key_revoked": false,
  "api_key_expires_at": "2026-09-30T10:27:41Z"
}
```

| Field | Purpose |
|---|---|
| `app_id` | Internal application identifier |
| `name` | Application name |
| `api_key_hash` | Hashed API-key representation |
| `api_key_revoked` | Current revocation state |
| `api_key_expires_at` | Credential expiration timestamp |

### `rate_limit_rules`

```json
{
  "rule_id": "rule_xxxxx",
  "app_id": "app_xxxxx",
  "method": "GET",
  "resource": "/api/v1/payments",
  "algorithm": "fixed_window",
  "config": {
    "limit": 10,
    "window_size": 60
  }
}
```

| Field | Purpose |
|---|---|
| `rule_id` | Rule identifier |
| `app_id` | Owning application |
| `method` | HTTP method |
| `resource` | Protected resource |
| `algorithm` | Selected rate-limiting algorithm |
| `config` | Algorithm-specific configuration |

MongoDB stores durable configuration, not high-frequency request counters.

---

## Technology Stack

**Backend**
- Python
- FastAPI
- Uvicorn
- PyMongo
- Redis
- Pydantic

**Data Layer**
- **MongoDB** — persistent application configuration (applications, rate-limit rules)
- **Redis** — runtime, low-latency state (rate-limiter state, request counters, runtime statistics, cached rule resolution)

```
MongoDB
   |
   +-- Durable configuration

Redis
   |
   +-- High-frequency runtime state
```

**Frontend**
- React
- Vite

---

## Frontend & Dashboard

The frontend is a React/Vite-based management console that communicates with the backend exclusively through the RLaaS API. It currently focuses on the core operational workflow: authentication, application identity, dashboard overview, rule management (create/modify), and application statistics.

The **Overview dashboard** provides the operational summary for the authenticated application:

- **Application** — Application Name, Application ID
- **Statistics** — Total Requests, Allowed Requests, Blocked Requests, Block Rate
- **Configuration** — Active rules, Recently configured rules
- **System** — API availability

The dashboard intentionally avoids presenting data the backend cannot reliably provide.

---

## Project Structure

```
Rate Limiter/
│
├── Backend/
│   ├── Limiter/
│   │   ├── Algorithms/
│   │   │   ├── Fixed_window.py
│   │   │   ├── Sliding_window.py
│   │   │   └── Token_bucket.py
│   │   │
│   │   ├── __init__.py
│   │   ├── factory.py
│   │   ├── limiter.py
│   │   └── statistics.py
│   │
│   ├── auth/
│   │   ├── api_key.py
│   │   ├── authorization.py
│   │   └── management_limit.py
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   ├── algorithm_registry.py
│   │   ├── cache.py
│   │   └── validation.py
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── mongo_apps.py
│   │   ├── mongo_rules.py
│   │   └── mongodb.py
│   │
│   ├── models/
│   │   ├── app.py
│   │   ├── rate_limit.py
│   │   └── rule.py
│   │
│   ├── routes/
│   │   ├── apps.py
│   │   └── rules.py
│   │
│   ├── scripts/
│   │   └── seed.py
│   │
│   ├── tests/
│   │   ├── concurrent_test.py
│   │   ├── fixed_window_test.py
│   │   ├── sliding_window_test.py
│   │   └── token_bucket_test.py
│   │
│   ├── .dockerignore
│   ├── .env
│   ├── .env example
│   ├── .env.docker
│   ├── .env.docker example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── main.py
│   ├── requirements.txt
│   └── __init__.py
│
├── Rlaas-frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   │
│   ├── src/
│   │   ├── api/
│   │   │   ├── applications.js
│   │   │   ├── client.js
│   │   │   ├── errors.js
│   │   │   ├── rateLimiter.js
│   │   │   ├── rules.js
│   │   │   ├── statistics.js
│   │   │   └── system.js
│   │   │
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   │
│   │   ├── auth/
│   │   │   ├── AuthContext.jsx
│   │   │   └── session.js
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   │
│   │   │   └── ui/
│   │   │       ├── ConfirmDialog.jsx
│   │   │       ├── MetricCard.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Notice.jsx
│   │   │       ├── PageHeader.jsx
│   │   │       ├── SimpleChart.jsx
│   │   │       └── StatusBadge.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── ApplicationsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── OverviewPage.jsx
│   │   │   ├── RequestTesterPage.jsx
│   │   │   ├── RulesPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   │
│   │   ├── utils/
│   │   │   └── format.js
│   │   │
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── README.md
│   ├── frontend_dump.txt
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
```

---

## Setup

### Prerequisites
- Python 3.12+
- Node.js
- Docker
- Docker Compose
- MongoDB
- Redis

### Backend

```bash
cd Backend
source ../.venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend is available at `http://127.0.0.1:8000`.
Swagger/OpenAPI docs: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd Rlaas-frontend
npm install
npm run dev
```

The frontend uses `VITE_API_BASE_URL`. For local development:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## Deployment Guide

The deployed system uses **Netlify** for the frontend, **Render** for the backend and Redis, and **MongoDB Atlas** for persistent storage.

```
Browser
   |
   v
Netlify
React Frontend
   |
   | HTTPS
   v
Render
FastAPI Backend
   |
   +-------> MongoDB Atlas
   |
   +-------> Redis
```

### Frontend Deployment (Netlify)
- **Base directory:** `Rlaas-frontend`
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Production environment variable:** `VITE_API_BASE_URL=https://<render-api>`

### Backend Deployment (Render)

Required environment variables:
```
MONGO_URI
REDIS_HOST
REDIS_PORT
```

Production secrets must be configured through the deployment platform and must never be committed to source control.

---

## Security Considerations

### API Keys
- Raw API keys are not unnecessarily exposed or persisted.
- Keys are displayed only when required by the credential lifecycle (e.g. immediately after creation or rotation).
- Persisted API-key material uses a hashed representation.

### Authentication
- Protected endpoints require API-key authentication.
- The backend resolves the API key to an authenticated application server-side.

### Authorization
- Application-scoped operations always use the authenticated `app_id`.
- Client-provided application identifiers never override the authenticated identity.

### CORS
- Production frontend origins are explicitly allowlisted.
- The API avoids unrestricted `allow_origins=["*"]` for authenticated browser access.

### Secrets
The following remain environment configuration and are never committed to Git or embedded in frontend source:
```
MONGO_URI
REDIS_HOST
REDIS_PORT
API credentials
```

### Infrastructure Isolation
The browser communicates only with the API — never directly with MongoDB or Redis. This prevents infrastructure credentials and internal services from being exposed to clients.

### Request Size Protection
Request bodies are restricted to a configured maximum size to reduce unnecessary resource consumption from oversized payloads.

### HTTP Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
```

---

## Testing

The project contains tests covering the core rate-limiting algorithms, run independently from the HTTP layer so algorithm behavior can be validated without a full application deployment:

- Fixed Window
- Sliding Window
- Token Bucket
- Concurrent Requests

---

## Engineering Trade-offs

**MongoDB vs Redis** — MongoDB handles durable configuration; Redis handles high-frequency runtime state. This prevents the persistent database from becoming the primary synchronization mechanism for request counters.

**Centralized Rate Limiting** — Centralizing enforcement provides consistent policies across client applications, at the cost of an additional network hop:
```
Client → RLaaS → Client decision
```
The system therefore depends on low-latency infrastructure and Redis availability.

**API-Key Authentication** — API keys provide simple machine-to-machine authentication, but make key lifecycle management (rotation, expiration, revocation, secure storage, secret exposure prevention) an important operational concern.

---

## Current Limitations

RLaaS currently focuses on the core rate-limiting control plane and enforcement workflow. The following are intentionally not yet complete production features:

- Distributed multi-region rate limiting
- Full request logging
- Historical analytics
- Time-series metrics
- Advanced user threat scoring
- Alerting
- Role-based access control
- Organization/team management
- Webhook integrations
- Automated abuse detection
- Multi-tenant billing
- Advanced observability

These are potential evolution paths rather than dependencies of the current system.

---

## Future Engineering Roadmap

### Phase 1 — Reliability
- Redis health checks
- MongoDB health checks
- Connection retry strategies
- Graceful dependency failure handling
- Explicit fail-open/fail-closed policy (currently, Redis unavailability can result in an API error rather than a distinguishable failure mode from "rate limit exceeded")
- Improved timeout and connection management

### Phase 2 — Distributed Rate Limiting
Move rate-limit state toward fully distributed operation so all API instances make consistent decisions against shared state:
```
              Load Balancer
                    |
          +---------+---------+
          |         |         |
         API       API       API
          |         |         |
          +---------+---------+
                    |
                  Redis
```
Potential improvements: atomic Redis Lua scripts, distributed counters, consistent key design, race-condition analysis, horizontal API scaling.

### Phase 3 — Observability
```
Application
    |
    +-- Metrics
    +-- Logs
    +-- Traces
    |
Observability Platform
```
Potential metrics: requests/sec, allowed/sec, blocked/sec, rule evaluation latency, Redis latency, MongoDB latency, error rate, authentication failure rate, P95/P99 latency.

### Phase 4 — Historical Analytics
```
                Requests
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
      1 min      1 hour      1 day
        │          │          │
        └──────────┼──────────┘
                   ▼
              Analytics
```
Potential capabilities: historical request volume, block-rate trends, per-rule and per-user analytics, traffic spike/peak detection.


### Phase 5 — Rule Versioning
```
Rule v1 → Rule v2 → Rule v3
```
Version history, rollback, scheduled activation, and configuration comparison.


### Phase 6 — Multi-Tenant Architecture
```
Organization
    │
    ├── Application A
    ├── Application B
    └── Application C
```
Organizations, teams, members, roles, per-organization quotas, and tenant isolation.

### Phase 8 — Rule Templates & Advanced Algorithms
Reusable policy templates (Strict API, Standard API, Public Endpoint, Authentication Endpoint, High-Traffic Endpoint) and advanced algorithms: Leaky Bucket, GCRA, Distributed Sliding Window, Adaptive Rate Limiting, weighted and multi-dimensional limits, e.g.:
```
Application limit + User limit + Endpoint limit + IP limit
```

### Phase 9 — Alerting & Audit Logging
Alerts for block-rate thresholds, request-volume thresholds, authentication-failure thresholds, Redis unavailability, and elevated API error rates, deliverable via email, Slack, or webhooks. An administrative audit trail recording actor, application, rule, operation, and before/after values, e.g.:
```
2026-09-01  admin  rule_123  UPDATE  limit: 10 -> 20
```

---

