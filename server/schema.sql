-- PostgreSQL schema for shared VI Planer state (Railway / any Postgres).
-- Applied automatically on server startup; kept here for reference.

CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY DEFAULT 'main',
  payload JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);

INSERT INTO app_state (id, payload, updated_at)
VALUES ('main', '{}'::jsonb, 0)
ON CONFLICT (id) DO NOTHING;
