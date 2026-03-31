-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(500),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORGANIZATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  website     VARCHAR(500),
  logo_url    VARCHAR(500),
  owner_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORG MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  role       VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title                VARCHAR(500)  NOT NULL,
  description          TEXT,
  category             VARCHAR(100),
  tags                 TEXT[]        DEFAULT '{}',
  location             VARCHAR(500),
  is_virtual           BOOLEAN       DEFAULT false,
  start_date           TIMESTAMPTZ,
  end_date             TIMESTAMPTZ,
  price                DECIMAL(10,2) DEFAULT 0,
  capacity             INTEGER,
  registered_count     INTEGER       DEFAULT 0,
  image_url            VARCHAR(500),
  status               VARCHAR(50)   DEFAULT 'published',
  search_vector        TSVECTOR,
  embedding            VECTOR(1536),
  likes_count          INTEGER       DEFAULT 0,
  saves_count          INTEGER       DEFAULT 0,
  created_at           TIMESTAMPTZ   DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title          VARCHAR(500)  NOT NULL,
  description    TEXT,
  category       VARCHAR(100),
  tags           TEXT[]        DEFAULT '{}',
  price          DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock          INTEGER,
  image_url      VARCHAR(500),
  status         VARCHAR(50)   DEFAULT 'active',
  search_vector  TSVECTOR,
  embedding      VECTOR(1536),
  likes_count    INTEGER       DEFAULT 0,
  saves_count    INTEGER       DEFAULT 0,
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INTERACTIONS (likes, saves, registrations)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interactions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type        VARCHAR(50) NOT NULL,
  item_id          UUID        NOT NULL,
  interaction_type VARCHAR(50) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id, interaction_type)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- REFRESH TOKENS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_org_id        ON events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_status        ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date    ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_category      ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_created_at    ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_search_vector ON events USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_products_org_id        ON products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_status        ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category      ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at    ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_interactions_user_id   ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_item      ON interactions(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_interactions_composite ON interactions(user_id, item_type, item_id, interaction_type);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id  ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Vector indexes for semantic search (requires pgvector)
CREATE INDEX IF NOT EXISTS idx_events_embedding   ON events   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_products_embedding ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Search vector update for events
CREATE OR REPLACE FUNCTION update_event_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '')       || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.category, '')    || ' ' ||
    COALESCE(NEW.location, '')    || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_event_search_vector
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_event_search_vector();

-- Search vector update for products
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '')       || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.category, '')    || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_product_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Interaction count de-normalisation triggers
CREATE OR REPLACE FUNCTION update_item_counts()
RETURNS TRIGGER AS $$
DECLARE
  delta INTEGER;
  like_count INTEGER;
  save_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN delta := 1; ELSE delta := -1; END IF;

  IF NEW IS NOT NULL THEN
    IF NEW.item_type = 'event' AND NEW.interaction_type = 'like' THEN
      UPDATE events SET likes_count = likes_count + delta WHERE id = NEW.item_id;
    ELSIF NEW.item_type = 'event' AND NEW.interaction_type = 'save' THEN
      UPDATE events SET saves_count = saves_count + delta WHERE id = NEW.item_id;
    ELSIF NEW.item_type = 'event' AND NEW.interaction_type = 'register' THEN
      UPDATE events SET registered_count = registered_count + delta WHERE id = NEW.item_id;
    ELSIF NEW.item_type = 'product' AND NEW.interaction_type = 'like' THEN
      UPDATE products SET likes_count = likes_count + delta WHERE id = NEW.item_id;
    ELSIF NEW.item_type = 'product' AND NEW.interaction_type = 'save' THEN
      UPDATE products SET saves_count = saves_count + delta WHERE id = NEW.item_id;
    END IF;
  ELSE
    IF OLD.item_type = 'event' AND OLD.interaction_type = 'like' THEN
      UPDATE events SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.item_id;
    ELSIF OLD.item_type = 'event' AND OLD.interaction_type = 'save' THEN
      UPDATE events SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.item_id;
    ELSIF OLD.item_type = 'event' AND OLD.interaction_type = 'register' THEN
      UPDATE events SET registered_count = GREATEST(0, registered_count - 1) WHERE id = OLD.item_id;
    ELSIF OLD.item_type = 'product' AND OLD.interaction_type = 'like' THEN
      UPDATE products SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.item_id;
    ELSIF OLD.item_type = 'product' AND OLD.interaction_type = 'save' THEN
      UPDATE products SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.item_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_interaction_counts
  AFTER INSERT OR DELETE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_item_counts();
