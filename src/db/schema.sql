-- Esquema inicial (Fase 1): una fila por conversacion (canal + usuario),
-- con el historial y si la esta atendiendo el bot o un humano.

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'messenger', 'instagram')),
  external_user_id TEXT NOT NULL, -- numero de WhatsApp o PSID de Messenger/Instagram
  status TEXT NOT NULL DEFAULT 'bot' CHECK (status IN ('bot', 'escalado')),
  messages JSONB NOT NULL DEFAULT '[]', -- historial [{role, content, at}]
  escalated_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
