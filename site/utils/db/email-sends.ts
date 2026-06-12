/**
 * Email broadcast history for Future Together.
 * Stores a record of every bulk email sent to community members.
 *
 * Backed by the Supabase email_sends table.
 *
 * Table columns used:
 *   id               uuid        primary key
 *   subject          text        email subject line
 *   body_markdown    text        source markdown content
 *   sent_at          timestamptz when the broadcast was sent
 *   recipient_count  integer     number of members targeted
 *   sent_by_id       uuid        admin user UUID (NOT NULL)
 *   resend_batch_id  text        optional Resend batch reference
 */

import type { State } from "@/utils.ts";

export interface EmailBroadcast {
  id: string;
  subject: string;
  bodyMarkdown: string; // maps to body_markdown
  sentAt: string;
  recipientCount: number; // maps to recipient_count
  sentCount: number; // maps to sent_count
  failedCount: number; // maps to failed_count
  recipientEmails: string[]; // maps to recipient_emails
  sentByProfileId: string; // maps to sent_by_id (admin user UUID)
  resendBatchId?: string; // maps to resend_batch_id
}

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------

function rowToEmailBroadcast(row: Record<string, unknown>): EmailBroadcast {
  return {
    id: row.id as string,
    subject: row.subject as string,
    bodyMarkdown: row.body_markdown as string,
    sentAt: row.sent_at as string,
    recipientCount: row.recipient_count as number,
    sentCount: row.sent_count as number,
    failedCount: row.failed_count as number,
    recipientEmails: row.recipient_emails as string[],
    sentByProfileId: row.sent_by_id as string,
    resendBatchId: (row.resend_batch_id as string) ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/** Save a new broadcast record to email_sends. */
export async function saveEmailBroadcast(
  broadcast: EmailBroadcast,
  state: State,
): Promise<void> {
  const db = state.supabaseClient;
  const { error } = await db.from("email_sends").insert({
    id: broadcast.id,
    subject: broadcast.subject,
    body_markdown: broadcast.bodyMarkdown,
    sent_at: broadcast.sentAt,
    recipient_count: broadcast.recipientCount,
    recipient_emails: broadcast.recipientEmails,
    sent_by_id: broadcast.sentByProfileId,
    resend_batch_id: broadcast.resendBatchId ?? null,
  });
  if (error) {
    console.error("saveEmailBroadcast error:", error.message);
  }
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Return all broadcasts, newest first. */
export async function getEmailBroadcasts(
  state: State,
): Promise<EmailBroadcast[]> {
  try {
    const db = state.supabaseClient;
    const { data: rows } = await db
      .from("email_sends")
      .select("*")
      .order("sent_at", { ascending: false });
    if (!rows) return [];
    return rows.map((row) =>
      rowToEmailBroadcast(row as Record<string, unknown>)
    );
  } catch {
    return [];
  }
}

/** Look up a single broadcast by ID. */
export async function getEmailBroadcastById(
  id: string,
  state: State,
): Promise<EmailBroadcast | null> {
  try {
    const db = state.supabaseClient;
    const { data: row } = await db
      .from("email_sends")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!row) return null;
    return rowToEmailBroadcast(row as Record<string, unknown>);
  } catch {
    return null;
  }
}
