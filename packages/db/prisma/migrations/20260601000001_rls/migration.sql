-- Row-Level Security policies for multi-tenant isolation.
-- The application MUST `SET LOCAL app.current_workspace = '<id>'`
-- at the start of every transaction; policies then filter rows automatically.
--
-- This is defense in depth: even if app code forgets a `where workspaceId = ...`,
-- the database refuses to return cross-tenant data.

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Helper: extract current workspace from session GUC
CREATE OR REPLACE FUNCTION current_workspace() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.current_workspace', true)
$$;

-- Policies
CREATE POLICY ws_isolation_docs   ON documents          USING ("workspaceId" = current_workspace());
CREATE POLICY ws_isolation_chans  ON channels           USING ("workspaceId" = current_workspace());
CREATE POLICY ws_isolation_files  ON files              USING ("workspaceId" = current_workspace());
CREATE POLICY ws_isolation_notifs ON notifications      USING ("workspaceId" = current_workspace());
CREATE POLICY ws_isolation_embs   ON embeddings         USING ("workspaceId" = current_workspace());
CREATE POLICY ws_isolation_mems   ON workspace_members  USING ("workspaceId" = current_workspace());

-- Joined tables — policy follows the parent
CREATE POLICY ws_isolation_msgs ON messages
  USING (EXISTS (
    SELECT 1 FROM channels c
    WHERE c.id = messages."channelId" AND c."workspaceId" = current_workspace()
  ));

CREATE POLICY ws_isolation_versions ON document_versions
  USING (EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_versions."documentId" AND d."workspaceId" = current_workspace()
  ));

-- pgvector index (HNSW for fast ANN search)
CREATE INDEX IF NOT EXISTS embeddings_vector_hnsw
  ON embeddings USING hnsw (embedding vector_cosine_ops);

-- Full-text search index on messages (cheaper than OpenSearch for small workspaces)
CREATE INDEX IF NOT EXISTS messages_content_fts
  ON messages USING gin (to_tsvector('english', content::text));

-- BRIN index on audit_log (append-only, time-ordered)
CREATE INDEX IF NOT EXISTS audit_log_created_brin
  ON audit_log USING brin ("createdAt");
