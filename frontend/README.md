# Frontend — AI-Powered Event & Marketplace Platform

Next.js 14 (App Router) frontend with TypeScript, Tailwind CSS, Zustand state management, and Framer Motion animations.

---

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + `tailwind-merge`
- **UI Primitives**: Radix UI
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State**: Zustand
- **HTTP Client**: Axios (with auto token refresh interceptor)
- **Notifications**: react-hot-toast
- **Date Formatting**: date-fns

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### 3. Start development server

```bash
npm run dev
```

Frontend runs at **http://localhost:3000**

> Make sure the backend is running at `http://localhost:5001` before using the app.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Start production server (requires build) |
| `npm run lint` | ESLint check |

---

## Pages

| Route | Description | Auth Required |
|---|---|---|
| `/login` | Login with email + password | No |
| `/register` | Create a new account | No |
| `/feed` | Mixed events + products feed | No (interactions require auth) |
| `/search` | Natural language semantic search | No |
| `/organizations` | Browse all organizations | No |
| `/organizations/[id]` | Org detail + manage events & products | Partial |
| `/profile` | User profile and saved items | Yes |

---

## Project Structure

```
app/
├── globals.css             # Tailwind base styles
├── layout.tsx              # Root layout with Navbar + Toaster
├── page.tsx                # Home redirect
├── feed/
│   └── page.tsx            # Mixed feed with like/save
├── login/
│   └── page.tsx            # Login form
├── register/
│   └── page.tsx            # Registration form
├── organizations/
│   ├── page.tsx            # Organizations list
│   └── [id]/
│       └── page.tsx        # Org detail + event/product management
├── profile/
│   └── page.tsx            # User profile
└── search/
    └── page.tsx            # Search page

components/
├── AppLayout.tsx           # Authenticated layout wrapper
├── FeedCard.tsx            # Event/product card with interactions
├── Navbar.tsx              # Top navigation bar
└── ui/
    ├── Avatar.tsx          # User avatar
    ├── badge.tsx           # Status/category badge
    ├── button.tsx          # Button variants
    ├── card.tsx            # Card container
    ├── input.tsx           # Form input
    ├── Modal.tsx           # Dialog/modal
    └── skeleton.tsx        # Loading skeleton

lib/
├── api.ts                  # Axios instance + auto token refresh
└── utils.ts                # cn() helper, formatters

store/
├── auth.ts                 # Auth state (user, tokens, login/logout)
├── feed.ts                 # Feed state (items, pagination, filters)
└── search.ts               # Search state (query, results, loading)
```

---

## State Management

Uses [Zustand](https://github.com/pmndrs/zustand) for global state. Three stores:

### `auth.ts`
- Persists user + tokens to `localStorage`
- Exposes `login()`, `logout()`, `setUser()` actions
- Used by the Axios interceptor for automatic token attachment

### `feed.ts`
- Manages paginated feed items, active filters (type, category, search)
- Handles optimistic like/save toggle updates

### `search.ts`
- Manages search query, results, and loading state
- Debounced query submissions

---

## API Integration

The Axios instance in `lib/api.ts`:
- Automatically attaches `Authorization: Bearer <token>` to all requests
- Intercepts `401` responses and attempts a token refresh
- Retries the original request with the new token
- Calls `logout()` and redirects to `/login` if refresh fails

```ts
import api from '@/lib/api';

// All requests automatically include auth headers
const { data } = await api.get('/feed');
const { data } = await api.post('/interactions', { ... });
```

---

## Key Features

### Like / Save Toggle
Optimistic UI updates — the UI updates immediately on click, and rolls back if the API call fails.

### Semantic Search
The search page sends natural language queries to the backend which uses Google Gemini embeddings + pgvector cosine similarity to return relevance-ranked results. Results include a relevance score displayed as a badge.

### Organization Management
Users who own or are members of an organization can:
- Create, edit, and delete events and products from the org detail page
- Tabbed interface: separate tabs for Events and Products
- Inline modals for create/edit forms — no page navigation required

### Responsive Layout
All pages are responsive and work on mobile, tablet, and desktop viewports using Tailwind CSS responsive prefixes.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL (e.g. `http://localhost:5001/api`) |
