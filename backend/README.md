# Backend — AI-Powered Event & Marketplace Platform

Express.js REST API with PostgreSQL, JWT auth, and AI-powered semantic search via Google Gemini embeddings.

---

## Stack

- **Runtime**: Node.js >= 18
- **Framework**: Express.js 4
- **Database**: PostgreSQL (Supabase) + pgvector extension
- **Auth**: JWT (access tokens 15m + refresh tokens 7d)
- **Validation**: Zod
- **Embeddings**: `@google/generative-ai` — `gemini-embedding-001` (768 dims)
- **API Docs**: Swagger UI (`swagger-jsdoc` + `swagger-ui-express`)
- **Testing**: Jest + Supertest

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy and fill in your values:

```bash
cp .env.example .env   # or create .env manually
```

```env
NODE_ENV=development
PORT=5001

# Database
DB_HOST=db.<your-project>.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
DB_SSL=true

# JWT
JWT_SECRET=min-32-char-secret
JWT_REFRESH_SECRET=min-32-char-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google AI (enables semantic search — optional but recommended)
GOOGLE_AI_API_KEY=your-google-ai-studio-key

# CORS
CORS_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 3. Run database migration

```bash
npm run migrate
```

This creates all tables and indexes in your PostgreSQL database. Safe to re-run — uses `CREATE TABLE IF NOT EXISTS`.

### 4. Start the server

```bash
npm run dev     # Development with nodemon (auto-restart on changes)
npm start       # Production
```

Server starts at **http://localhost:5001**

---

## URLs

| Resource | URL |
|---|---|
| API Base | http://localhost:5001/api |
| Swagger Docs | http://localhost:5001/api-docs |
| Health Check | http://localhost:5001/health |

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with nodemon (development) |
| `npm start` | Start without nodemon (production) |
| `npm run migrate` | Run DB schema migration |
| `npm test` | Run all tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run test:watch` | Tests in watch mode |

---

## Project Structure

```
src/
├── config/
│   ├── database.js      # pg Pool setup, retry logic
│   ├── env.js           # Validated env config
│   └── swagger.js       # Swagger/OpenAPI setup
├── controllers/         # Request handlers (thin layer)
│   ├── auth.controller.js
│   ├── event.controller.js
│   ├── feed.controller.js
│   ├── interaction.controller.js
│   ├── organization.controller.js
│   ├── product.controller.js
│   └── search.controller.js
├── db/
│   ├── schema.sql        # Full DB schema
│   └── migrate.js        # Migration runner
├── middleware/
│   ├── auth.js           # JWT verify, requireOrgMember
│   ├── error.js          # Global error handler
│   ├── rateLimit.js      # Rate limiter config
│   └── validate.js       # Zod schema validation
├── routes/
│   ├── index.js          # Route mounting
│   ├── auth.routes.js
│   ├── event.routes.js
│   ├── feed.routes.js
│   ├── interaction.routes.js
│   ├── organization.routes.js
│   ├── product.routes.js
│   └── search.routes.js
├── services/            # Business logic layer
│   ├── auth.service.js
│   ├── event.service.js
│   ├── feed.service.js
│   ├── interaction.service.js
│   ├── organization.service.js
│   ├── product.service.js
│   └── search.service.js
├── utils/
│   ├── asyncHandler.js   # Wraps async controllers
│   ├── embedding.util.js # Gemini embedding generation
│   ├── jwt.util.js       # Token sign/verify helpers
│   └── response.util.js  # Standardized API responses
├── validators/
│   ├── auth.validator.js
│   ├── event.validator.js
│   ├── organization.validator.js
│   └── product.validator.js
├── app.js               # Express app setup
└── server.js            # HTTP server + DB connection
```

---

## API Reference

Full interactive docs: **http://localhost:5001/api-docs**

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register new user |
| `POST` | `/api/auth/login` | None | Login, returns tokens |
| `POST` | `/api/auth/refresh` | None | Refresh access token |
| `POST` | `/api/auth/logout` | Bearer | Invalidate refresh token |
| `GET` | `/api/auth/me` | Bearer | Get current user |

### Organizations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/organizations` | None | List all orgs |
| `POST` | `/api/organizations` | Bearer | Create org |
| `GET` | `/api/organizations/:id` | None | Get org + members |
| `PUT` | `/api/organizations/:id` | org member | Update org |
| `DELETE` | `/api/organizations/:id` | org owner | Delete org |
| `POST` | `/api/organizations/:id/members` | org owner | Add member |
| `DELETE` | `/api/organizations/:id/members/:userId` | org owner | Remove member |

### Events
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/organizations/:orgId/events` | None | List org events |
| `POST` | `/api/organizations/:orgId/events` | org member | Create event |
| `GET` | `/api/organizations/:orgId/events/:id` | None | Get event |
| `PUT/PATCH` | `/api/organizations/:orgId/events/:id` | org member | Update event |
| `DELETE` | `/api/organizations/:orgId/events/:id` | org member | Delete event |

### Products
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/organizations/:orgId/products` | None | List org products |
| `POST` | `/api/organizations/:orgId/products` | org member | Create product |
| `GET` | `/api/organizations/:orgId/products/:id` | None | Get product |
| `PUT/PATCH` | `/api/organizations/:orgId/products/:id` | org member | Update product |
| `DELETE` | `/api/organizations/:orgId/products/:id` | org member | Delete product |

### Feed & Search
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/feed` | Optional Bearer | Mixed events+products feed |
| `GET` | `/api/search?q=...` | Optional Bearer | Natural language search |

### Interactions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/interactions` | Bearer | Like / save / register (toggle) |
| `GET` | `/api/interactions/mine` | Bearer | Get user's interactions |

---

## Database Schema

### Tables
- `users` — registered users
- `organizations` — organizations with logo, description, website
- `org_members` — user ↔ org membership with roles (`owner`, `admin`, `member`)
- `events` — events with dates, location, capacity, virtual flag
- `products` — products with price, stock, SKU
- `interactions` — likes/saves/registrations (user ↔ event/product)
- `refresh_tokens` — token rotation tracking

### Vector Search
`events.embedding` and `products.embedding` store `VECTOR(768)` columns.
Indexed with `ivfflat` for approximate nearest-neighbor search using cosine distance.

---

## Semantic Search

When `GOOGLE_AI_API_KEY` is set:
1. Embeddings are generated on event/product create and update using `gemini-embedding-001` with `outputDimensionality: 768`
2. Search queries are embedded with task type `RETRIEVAL_QUERY`
3. Stored documents use task type `RETRIEVAL_DOCUMENT`
4. Similarity is computed using PostgreSQL's `<=>` (cosine distance) operator

When the key is not set, falls back to PostgreSQL full-text search (`tsvector` + `tsquery`).

---

## Security

- Passwords hashed with `bcryptjs` (cost factor 12)
- JWT secrets validated for minimum 32-char length
- Helmet.js HTTP security headers
- Rate limiting per IP
- Input validation with Zod on all endpoints
- Org membership verified before all write operations
- SQL injection prevented via parameterized `pg` queries
