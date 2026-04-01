# AI-Powered Event & Marketplace Platform

A full-stack platform where organizations can create and manage events and products, while users can browse, search with natural language (AI-powered semantic search), and interact with content.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Database** | PostgreSQL (Supabase) with pgvector |
| **AI / Embeddings** | Google Gemini (`gemini-embedding-001`) |
| **Auth** | JWT (access + refresh tokens) |
| **State Management** | Zustand |
| **API Docs** | Swagger UI |

---

## Project Structure

```
rubico-assignment/
├── backend/          # Express.js REST API
│   ├── src/
│   │   ├── config/   # DB, env, swagger config
│   │   ├── controllers/
│   │   ├── db/       # Schema & migration
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   └── package.json
├── frontend/         # Next.js 14 App Router
│   ├── app/          # Pages (feed, search, orgs, auth)
│   ├── components/   # Reusable UI components
│   ├── lib/          # API client, utilities
│   ├── store/        # Zustand state stores
│   └── package.json
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9
- A Supabase project with `pgvector` extension enabled
- Google AI Studio API key (for semantic search)

---

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd rubico-assignment
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
NODE_ENV=development
PORT=5001

# Database (Supabase PostgreSQL)
DB_HOST=db.<your-project-id>.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_SSL=true

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google AI Studio (semantic search)
GOOGLE_AI_API_KEY=your-google-ai-api-key

# CORS
CORS_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

Run database migration:

```bash
npm run migrate
```

Start the backend:

```bash
npm run dev        # Development (nodemon, auto-restart)
npm start          # Production
```

Backend runs at: **http://localhost:5001**

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Start the frontend:

```bash
npm run dev        # Development
npm run build      # Production build
npm start          # Production server
```

Frontend runs at: **http://localhost:3000**

---

## Important URLs

| Resource | URL |
|---|---|
| **Frontend App** | http://localhost:3000 |
| **Backend API** | http://localhost:5001/api |
| **Swagger API Docs** | http://localhost:5001/api-docs |
| **Health Check** | http://localhost:5001/health |

---

## Features

### Core
- **Auth** — Register/Login with JWT access + refresh token rotation
- **Organizations** — Create and manage organizations; role-based access (owner/admin/member)
- **Events** — Full CRUD for events under organizations (virtual/in-person, capacity, dates)
- **Products** — Full CRUD for products under organizations (stock, pricing, categories)
- **Feed** — Mixed paginated feed of events + products with filters
- **Search** — Natural language semantic search powered by Google Gemini embeddings + cosine similarity via pgvector
- **Interactions** — Like, save, and register for events/products (toggle support)

### Frontend Pages
| Route | Description |
|---|---|
| `/` | Landing / redirect |
| `/login` | Login page |
| `/register` | Registration page |
| `/feed` | Mixed event + product feed with like/save |
| `/search` | Natural language search with ranked results |
| `/organizations` | List of organizations |
| `/organizations/[id]` | Org detail — manage events & products |
| `/profile` | User profile |

---

## Architecture Decisions

### Semantic Search with pgvector
Events and products are embedded using Google's `gemini-embedding-001` model (768 dimensions) at creation/update time. Search queries are also embedded and matched via cosine similarity (`<=>` operator) in PostgreSQL using the `pgvector` extension. Falls back to PostgreSQL full-text search (`tsvector`) when embeddings are unavailable.

### Role-Based Access Control
Organization membership is tracked in an `org_members` table with roles (`owner`, `admin`, `member`). All write operations on events/products are guarded by `requireOrgMember` middleware that resolves the org from either route params or request body.

### Refresh Token Rotation
Short-lived access tokens (15m) + long-lived refresh tokens (7d) stored in the `refresh_tokens` table. Each refresh rotates the token, invalidating the old one.

### UNION ALL for Feed
The feed query uses `UNION ALL` to merge events and products in a single DB query, enabling correct server-side pagination and sorting at scale.

---

## API Overview

Full interactive documentation is available at **http://localhost:5001/api-docs**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/refresh` | Refresh token |
| `GET` | `/api/feed` | Get mixed feed |
| `GET` | `/api/search?q=...` | Natural language search |
| `GET/POST` | `/api/organizations` | List / create orgs |
| `GET/PUT/DELETE` | `/api/organizations/:id` | Org CRUD |
| `GET/POST` | `/api/organizations/:orgId/events` | Event CRUD |
| `GET/POST` | `/api/organizations/:orgId/products` | Product CRUD |
| `POST` | `/api/interactions` | Like / save / register |

---

## Running Tests

```bash
cd backend
npm test                  # Run all tests
npm run test:coverage     # With coverage report
```

---

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: 5001) | Server port |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | No (default: 5432) | PostgreSQL port |
| `DB_NAME` | Yes | Database name |
| `DB_USER` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `DB_SSL` | No (default: false) | Enable SSL for DB |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret (min 32 chars) |
| `JWT_EXPIRES_IN` | No (default: 15m) | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | No (default: 7d) | Refresh token expiry |
| `GOOGLE_AI_API_KEY` | No | Enables semantic search |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
