/**
 * Email broadcast history for Future Together.
 * Stores a record of every bulk email sent to community members.
 *
 * Key structure:
 *   ["email_broadcast", id] → EmailBroadcast
 */

import { getKv } from "./kv.ts";

export interface EmailBroadcast {
  id: string;
  subject: string;
  markdown: string; // source content; HTML is derived on demand
  sentAt: string; // ISO timestamp
  total: number; // members in list at time of send
  sent: number; // confirmed delivered by Resend
  failed: number;
  recipientEmails: string[]; // snapshot of who received it
}

/** Save a new broadcast record. */
export async function saveEmailBroadcast(
  broadcast: EmailBroadcast,
): Promise<void> {
  const kv = await getKv();
  await kv.set(["email_broadcast", broadcast.id], broadcast);
}

/** Return all broadcasts, newest first. */
export async function getEmailBroadcasts(): Promise<EmailBroadcast[]> {
  const kv = await getKv();
  const broadcasts: EmailBroadcast[] = [];
  const iter = kv.list<EmailBroadcast>({ prefix: ["email_broadcast"] });
  for await (const { value } of iter) {
    broadcasts.push(value);
  }
  return broadcasts.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

/** Look up a single broadcast by ID. */
export async function getEmailBroadcastById(
  id: string,
): Promise<EmailBroadcast | null> {
  const kv = await getKv();
  const result = await kv.get<EmailBroadcast>(["email_broadcast", id]);
  return result.value;
}
