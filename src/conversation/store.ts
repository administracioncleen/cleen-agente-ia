import { pool } from "../db";

export type Channel = "whatsapp" | "messenger" | "instagram";
export type ConversationStatus = "bot" | "escalado";

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface Conversation {
  id: number;
  channel: Channel;
  externalUserId: string;
  status: ConversationStatus;
  messages: StoredMessage[];
  escalatedReason: string | null;
}

export async function getOrCreateConversation(
  channel: Channel,
  externalUserId: string
): Promise<Conversation> {
  const existing = await pool.query(
    `SELECT id, channel, external_user_id, status, messages, escalated_reason
     FROM conversations WHERE channel = $1 AND external_user_id = $2`,
    [channel, externalUserId]
  );

  if (existing.rows.length > 0) {
    return mapRow(existing.rows[0]);
  }

  const inserted = await pool.query(
    `INSERT INTO conversations (channel, external_user_id)
     VALUES ($1, $2)
     RETURNING id, channel, external_user_id, status, messages, escalated_reason`,
    [channel, externalUserId]
  );
  return mapRow(inserted.rows[0]);
}

export async function appendMessage(conversationId: number, message: StoredMessage): Promise<void> {
  await pool.query(
    `UPDATE conversations
     SET messages = messages || $2::jsonb, updated_at = now()
     WHERE id = $1`,
    [conversationId, JSON.stringify([message])]
  );
}

export async function escalateConversation(conversationId: number, reason: string): Promise<void> {
  await pool.query(
    `UPDATE conversations
     SET status = 'escalado', escalated_reason = $2, updated_at = now()
     WHERE id = $1`,
    [conversationId, reason]
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Conversation {
  return {
    id: row.id,
    channel: row.channel,
    externalUserId: row.external_user_id,
    status: row.status,
    messages: row.messages,
    escalatedReason: row.escalated_reason,
  };
}
