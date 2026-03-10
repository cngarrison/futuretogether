import { define } from "@/utils.ts";
import { marked } from "marked";
import {
  buildEmailHtml,
  FROM_EMAIL,
  FROM_NAME,
  RESEND_API_KEY,
} from "@/utils/email.ts";
import { getActiveMembers } from "@/utils/members.ts";
import type { Member } from "@/utils/members.ts";
import { logStaffAccess } from "@/utils/staff-log.ts";
import { saveEmailBroadcast } from "@/utils/emailBroadcast.ts";

/**
 * POST /api/staff/emails/send
 *
 * Sends a markdown-authored email to all active members via the
 * Resend batch API (max 100 per call; loops for larger lists).
 *
 * Supports {{firstName}}, {{lastName}}, {{fullName}}, {{email}}
 * variable interpolation per recipient.
 *
 * With testOnly: true, sends a single email to the address configured
 * in FT_EMAIL_TEST (JSON env var) using the test member variables.
 *
 * Protected by /api/staff/_middleware.ts (session cookie auth).
 *
 * Request body: { subject: string; markdown: string; testOnly?: boolean }
 * Response:     { sent, failed, total, testOnly?, to?, broadcastId? }
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BatchEmailItem {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface TestConfig {
  to: string;
  vars: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Variable interpolation
// ---------------------------------------------------------------------------

/** Replace {{varName}} tokens in text. Unrecognised vars are left as-is. */
function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function memberVars(member: Member): Record<string, string> {
  const firstName = member.firstName?.trim() || "member";
  const lastName = member.lastName?.trim() || "";
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  return { firstName, lastName, fullName, email: member.email };
}

/**
 * Parse FT_EMAIL_TEST env var (JSON string) to get test recipient config.
 *
 * Expected format:
 *   {"to":"you@example.com","firstName":"Charlie","lastName":"Garrison","email":"you@example.com"}
 *
 * Falls back to FT_CONTACT_EMAIL / FROM_EMAIL with placeholder values if not set.
 */
function getTestConfig(): TestConfig {
  const raw = Deno.env.get("FT_EMAIL_TEST");
  const fallbackTo = Deno.env.get("FT_CONTACT_EMAIL") ??
    Deno.env.get("FROM_EMAIL") ?? FROM_EMAIL;

  if (!raw) {
    return {
      to: fallbackTo,
      vars: {
        firstName: "Test",
        lastName: "Member",
        fullName: "Test Member",
        email: fallbackTo,
      },
    };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const firstName = parsed.firstName ?? "Test";
    const lastName = parsed.lastName ?? "Member";
    return {
      to: parsed.to ?? fallbackTo,
      vars: {
        firstName,
        lastName,
        fullName: parsed.fullName ?? `${firstName} ${lastName}`,
        email: parsed.email ?? fallbackTo,
      },
    };
  } catch {
    console.error("Failed to parse FT_EMAIL_TEST JSON — using defaults");
    return {
      to: fallbackTo,
      vars: {
        firstName: "Test",
        lastName: "Member",
        fullName: "Test Member",
        email: fallbackTo,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Resend batch sender
// ---------------------------------------------------------------------------

async function sendResendBatch(
  items: BatchEmailItem[],
): Promise<{ sent: number; failed: number }> {
  if (!RESEND_API_KEY) {
    console.error("FT_RESEND_API_KEY not configured");
    return { sent: 0, failed: items.length };
  }

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100);
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      if (res.ok) {
        const data = await res.json();
        sent += Array.isArray(data.data) ? data.data.length : chunk.length;
      } else {
        const errText = await res.text();
        console.error(`Resend batch error (chunk ${i / 100 + 1}):`, errText);
        failed += chunk.length;
      }
    } catch (err) {
      console.error(`Batch send exception (chunk ${i / 100 + 1}):`, err);
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const handler = define.handlers({
  async POST(ctx) {
    let reqBody: { subject?: string; markdown?: string; testOnly?: boolean };
    try {
      reqBody = await ctx.req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { subject, markdown, testOnly } = reqBody;

    if (!subject?.trim() || !markdown?.trim()) {
      return new Response(
        JSON.stringify({ error: "Both subject and markdown are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const subjectTrimmed = subject.trim();
    const markdownTrimmed = markdown.trim();
    const from = `${FROM_NAME} <${FROM_EMAIL}>`;

    // -----------------------------------------------------------------------
    // Test send — single email to configured test address
    // -----------------------------------------------------------------------
    if (testOnly) {
      const testConfig = getTestConfig();
      const interpolated = interpolate(markdownTrimmed, testConfig.vars);
      const contentHtml = marked.parse(interpolated, {
        async: false,
      }) as string;
      const emailHtml = buildEmailHtml(contentHtml, `[TEST] ${subjectTrimmed}`);

      const { sent, failed } = await sendResendBatch([{
        from,
        to: testConfig.to,
        subject: `[TEST] ${subjectTrimmed}`,
        html: emailHtml,
      }]);

      await logStaffAccess(
        `[${
          new Date().toISOString()
        }] Test email: "${subjectTrimmed}" → ${testConfig.to}`,
      );

      return new Response(
        JSON.stringify({
          sent,
          failed,
          total: 1,
          testOnly: true,
          to: testConfig.to,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // -----------------------------------------------------------------------
    // Bulk send — all active members, with per-member variable interpolation
    // -----------------------------------------------------------------------
    const members = await getActiveMembers();
    if (members.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active members to send to" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const items: BatchEmailItem[] = await Promise.all(
      members.map(async (m) => {
        const interpolated = interpolate(markdownTrimmed, memberVars(m));
        const contentHtml = await marked.parse(interpolated);
        return {
          from,
          to: m.email,
          subject: subjectTrimmed,
          html: buildEmailHtml(contentHtml, subjectTrimmed),
        };
      }),
    );

    const { sent, failed } = await sendResendBatch(items);
    const total = members.length;
    const broadcastId = crypto.randomUUID();

    await saveEmailBroadcast({
      id: broadcastId,
      subject: subjectTrimmed,
      markdown: markdownTrimmed,
      sentAt: new Date().toISOString(),
      total,
      sent,
      failed,
      recipientEmails: members.map((m) => m.email),
    });

    await logStaffAccess(
      `[${
        new Date().toISOString()
      }] Bulk email: "${subjectTrimmed}" — ${sent}/${total} sent, ${failed} failed`,
    );

    return new Response(
      JSON.stringify({ sent, failed, total, broadcastId }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  },
});
