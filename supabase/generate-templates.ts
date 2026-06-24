#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net
/**
 * Future Together — Supabase email template generator
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-env --allow-net supabase/generate-templates.ts
 *     → writes all HTML files to supabase/templates/
 *
 *   deno run --allow-read --allow-write --allow-env --allow-net supabase/generate-templates.ts --push
 *     → writes HTML files AND pushes all template content + subjects to Supabase Auth API
 *     → requires env vars: PROJECT_REF, SUPABASE_ACCESS_TOKEN
 */

import { join, dirname, fromFileUrl } from "jsr:@std/path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SITE_URL = "https://futuretogether.community";
const LOGO_URL = `${SITE_URL}/logo-white.svg`;

// ---------------------------------------------------------------------------
// Branded shell — extracted from site/utils/email.ts buildEmailHtml()
// ---------------------------------------------------------------------------

const HEADER = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Future Together</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; background-color: #f7f4ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  </style>
</head>
<body>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f4ef;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="background-color:#1a5f6e;border-radius:10px 10px 0 0;padding:28px 32px;text-align:center;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <img src="${LOGO_URL}" alt="Future Together" width="200" height="auto"
                     style="display:block;margin:0 auto;max-width:200px;" />
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;border-left:1px solid #e8e3db;border-right:1px solid #e8e3db;">
`;

const FOOTER = `
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f7f4ef;border:1px solid #e8e3db;border-top:none;border-radius:0 0 10px 10px;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">
                <a href="${SITE_URL}" style="color:#1a5f6e;text-decoration:none;font-weight:600;">Future Together</a>
                &nbsp;&middot;&nbsp;
                <a href="${SITE_URL}" style="color:#6b7280;text-decoration:none;">futuretogether.community</a>
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;"><em>The future is arriving. Let's face it together.</em></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ---------------------------------------------------------------------------
// Style shorthands
// ---------------------------------------------------------------------------

const H2 = `style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a5f6e;"`;
const P = `style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1c1a18;"`;
const PSMALL = `style="font-size:14px;color:#6b7280;margin:16px 0 0;"`;
const BTN = `style="display:inline-block;background-color:#c4853a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px;"`;
const SUPPORT_EMAIL = "hello@futuretogether.community";

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

interface AuthTemplate {
  kind: "auth";
  name: string;
  subject: string;
  content: string;
  apiSubjectKey: string;
  apiContentKey: string;
}

interface NotificationTemplate {
  kind: "notification";
  name: string;
  subject: string;
  content: string;
  apiEnabledKey: string;
  apiSubjectKey: string;
  apiContentKey: string;
}

type Template = AuthTemplate | NotificationTemplate;

const TEMPLATES: Template[] = [
  // ─── Auth email templates ────────────────────────────────────
  // Supported in config.toml [auth.email.template.*] and Supabase Management API.
  {
    kind: "auth",
    name: "invite",
    subject: "You've been invited to Future Together",
    apiSubjectKey: "mailer_subjects_invite",
    apiContentKey: "mailer_templates_invite_content",
    content: `
              <h2 ${H2}>You've been invited</h2>
              <p ${P}>You've been invited to create a Future Together account.</p>
              <p ${P}>Follow the link below to accept your invitation and get started.</p>
              <p style="margin:24px 0;">
                <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite" ${BTN}>Accept invitation</a>
              </p>
`,
  },
  {
    kind: "auth",
    name: "confirmation",
    subject: "Confirm your email address",
    apiSubjectKey: "mailer_subjects_confirmation",
    apiContentKey: "mailer_templates_confirmation_content",
    content: `
              <h2 ${H2}>Confirm your email address</h2>
              <p ${P}>Thanks for signing up. Follow the link below to confirm your email address and finish creating your account.</p>
              <p style="margin:24px 0;">
                <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup" ${BTN}>Confirm email address</a>
              </p>
`,
  },
  {
    kind: "auth",
    name: "recovery",
    subject: "Reset your password",
    apiSubjectKey: "mailer_subjects_recovery",
    apiContentKey: "mailer_templates_recovery_content",
    content: `
              <h2 ${H2}>Reset your password</h2>
              <p ${P}>We received a request to reset your password. Follow the link below to choose a new one.</p>
              <p style="margin:24px 0;">
                <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery" ${BTN}>Reset password</a>
              </p>
              <p ${PSMALL}>If you didn't request this, you can safely ignore this email.</p>
`,
  },
  {
    kind: "auth",
    name: "magic_link",
    subject: "Your sign-in link",
    apiSubjectKey: "mailer_subjects_magic_link",
    apiContentKey: "mailer_templates_magic_link_content",
    content: `
              <h2 ${H2}>Your sign-in link</h2>
              <p ${P}>Follow the link below to sign in to Future Together. This link expires shortly and can only be used once.</p>
              <p style="margin:24px 0;">
                <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink" ${BTN}>Sign in</a>
              </p>
              <h2 ${H2}>Your verification code</h2>
              <p ${P}>Alternatively, use the code below to verify your identity. It expires shortly and can only be used once.</p>
              <p style="font-size:36px;font-weight:700;color:#1a5f6e;letter-spacing:10px;text-align:center;margin:28px 0;font-family:monospace;">{{ .Token }}</p>
              <p ${PSMALL}>If you didn't request this sign-in link or code, you can safely ignore this email.</p>
`,
  },
  {
    kind: "auth",
    name: "email_change",
    subject: "Confirm your new email address",
    apiSubjectKey: "mailer_subjects_email_change",
    apiContentKey: "mailer_templates_email_change_content",
    content: `
              <h2 ${H2}>Confirm your new email address</h2>
              <p ${P}>Follow the link below to confirm <strong>{{ .NewEmail }}</strong> as your new email address.</p>
              <p style="margin:24px 0;">
                <a href="{{ .ConfirmationURL }}" ${BTN}>Confirm new email address</a>
              </p>
              <p ${PSMALL}>If you didn't request this change, you can safely ignore this email.</p>
`,
  },
  {
    kind: "auth",
    name: "reauthentication",
    subject: "Your verification code",
    apiSubjectKey: "mailer_subjects_reauthentication",
    apiContentKey: "mailer_templates_reauthentication_content",
    content: `
              <h2 ${H2}>Your verification code</h2>
              <p ${P}>Use the code below to verify your identity. It expires shortly and can only be used once.</p>
              <p style="font-size:36px;font-weight:700;color:#1a5f6e;letter-spacing:10px;text-align:center;margin:28px 0;font-family:monospace;">{{ .Token }}</p>
              <p ${PSMALL}>If you didn't request this code, you can safely ignore this email.</p>
`,
  },

  // ─── Security notification templates ───────────────────────────
  // Push-only via Supabase Management API (not supported in config.toml).
  // Each requires an _enabled: true flag to activate.
  {
    kind: "notification",
    name: "password_changed",
    subject: "Your password was changed",
    apiEnabledKey: "mailer_notifications_password_changed_enabled",
    apiSubjectKey: "mailer_subjects_password_changed_notification",
    apiContentKey: "mailer_templates_password_changed_notification_content",
    content: `
              <h2 ${H2}>Your password was changed</h2>
              <p ${P}>The password for your Future Together account was recently changed.</p>
              <p ${PSMALL}>If you didn't make this change, please reset your password and contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#1a5f6e;">${SUPPORT_EMAIL}</a>.</p>
`,
  },
  {
    kind: "notification",
    name: "email_changed",
    subject: "Your email address was changed",
    apiEnabledKey: "mailer_notifications_email_changed_enabled",
    apiSubjectKey: "mailer_subjects_email_changed_notification",
    apiContentKey: "mailer_templates_email_changed_notification_content",
    content: `
              <h2 ${H2}>Your email address was changed</h2>
              <p ${P}>The email address for your Future Together account was changed from <strong>{{ .OldEmail }}</strong> to <strong>{{ .Email }}</strong>.</p>
              <p ${PSMALL}>If you didn't make this change, contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#1a5f6e;">${SUPPORT_EMAIL}</a>.</p>
`,
  },
  {
    kind: "notification",
    name: "phone_changed",
    subject: "Your phone number was changed",
    apiEnabledKey: "mailer_notifications_phone_changed_enabled",
    apiSubjectKey: "mailer_subjects_phone_changed_notification",
    apiContentKey: "mailer_templates_phone_changed_notification_content",
    content: `
              <h2 ${H2}>Your phone number was changed</h2>
              <p ${P}>The phone number for your Future Together account was changed from <strong>{{ .OldPhone }}</strong> to <strong>{{ .Phone }}</strong>.</p>
              <p ${PSMALL}>If you didn't make this change, contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#1a5f6e;">${SUPPORT_EMAIL}</a>.</p>
`,
  },
  {
    kind: "notification",
    name: "mfa_factor_enrolled",
    subject: "A new verification method was added",
    apiEnabledKey: "mailer_notifications_mfa_factor_enrolled_enabled",
    apiSubjectKey: "mailer_subjects_mfa_factor_enrolled_notification",
    apiContentKey: "mailer_templates_mfa_factor_enrolled_notification_content",
    content: `
              <h2 ${H2}>A new verification method was added</h2>
              <p ${P}>Sign-in verification method <strong>{{ .FactorType }}</strong> was added to your Future Together account.</p>
              <p ${PSMALL}>If you didn't make this change, contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#1a5f6e;">${SUPPORT_EMAIL}</a>.</p>
`,
  },
  {
    kind: "notification",
    name: "mfa_factor_unenrolled",
    subject: "A verification method was removed",
    apiEnabledKey: "mailer_notifications_mfa_factor_unenrolled_enabled",
    apiSubjectKey: "mailer_subjects_mfa_factor_unenrolled_notification",
    apiContentKey: "mailer_templates_mfa_factor_unenrolled_notification_content",
    content: `
              <h2 ${H2}>A verification method was removed</h2>
              <p ${P}>Sign-in verification method <strong>{{ .FactorType }}</strong> was removed from your Future Together account.</p>
              <p ${PSMALL}>If you didn't make this change, contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#1a5f6e;">${SUPPORT_EMAIL}</a>.</p>
`,
  },
  {
    kind: "notification",
    name: "identity_linked",
    subject: "A new sign-in method was linked",
    apiEnabledKey: "mailer_notifications_identity_linked_enabled",
    apiSubjectKey: "mailer_subjects_identity_linked_notification",
    apiContentKey: "mailer_templates_identity_linked_notification_content",
    content: `
              <h2 ${H2}>A new sign-in method was linked</h2>
              <p ${P}>Your <strong>{{ .Provider }}</strong> account was linked as a new sign-in method for <strong>{{ .Email }}</strong>.</p>
              <p ${PSMALL}>If you didn't make this change, contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#1a5f6e;">${SUPPORT_EMAIL}</a>.</p>
`,
  },
  {
    kind: "notification",
    name: "identity_unlinked",
    subject: "A sign-in method was removed",
    apiEnabledKey: "mailer_notifications_identity_unlinked_enabled",
    apiSubjectKey: "mailer_subjects_identity_unlinked_notification",
    apiContentKey: "mailer_templates_identity_unlinked_notification_content",
    content: `
              <h2 ${H2}>A sign-in method was removed</h2>
              <p ${P}>Your <strong>{{ .Provider }}</strong> account was removed as a sign-in method for <strong>{{ .Email }}</strong>.</p>
              <p ${PSMALL}>If you didn't make this change, contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#1a5f6e;">${SUPPORT_EMAIL}</a>.</p>
`,
  },
];

// ---------------------------------------------------------------------------
// File generation
// ---------------------------------------------------------------------------

const __dir = dirname(fromFileUrl(import.meta.url));
const TEMPLATES_DIR = join(__dir, "templates");

async function generateFiles(): Promise<void> {
  await Deno.mkdir(TEMPLATES_DIR, { recursive: true });

  for (const tpl of TEMPLATES) {
    const html = HEADER + tpl.content + FOOTER;
    const outPath = join(TEMPLATES_DIR, `${tpl.name}.html`);
    await Deno.writeTextFile(outPath, html);
    const tag = tpl.kind === "notification" ? "[notif]" : "[auth] ";
    console.log(`  ✓ ${tag} ${tpl.name}.html`);
  }

  console.log(`\nGenerated ${TEMPLATES.length} templates in supabase/templates/`);
}

// ---------------------------------------------------------------------------
// Supabase Management API push
// ---------------------------------------------------------------------------

async function pushToSupabase(): Promise<void> {
  const projectRef = Deno.env.get("PROJECT_REF");
  const accessToken = Deno.env.get("SUPABASE_ACCESS_TOKEN");

  if (!projectRef) {
    console.error("ERROR: PROJECT_REF env var is not set");
    Deno.exit(1);
  }
  if (!accessToken) {
    console.error("ERROR: SUPABASE_ACCESS_TOKEN env var is not set");
    Deno.exit(1);
  }

  const payload: Record<string, string | boolean> = {};

  for (const tpl of TEMPLATES) {
    const html = HEADER + tpl.content + FOOTER;

    if (tpl.kind === "auth") {
      payload[tpl.apiSubjectKey] = tpl.subject;
      payload[tpl.apiContentKey] = html;
      console.log(`  → [auth]  ${tpl.name}`);
    } else {
      // Notification templates require an _enabled flag + subject + content
      payload[tpl.apiEnabledKey] = true;
      payload[tpl.apiSubjectKey] = tpl.subject;
      payload[tpl.apiContentKey] = html;
      console.log(`  → [notif] ${tpl.name}  (+ enabled=true)`);
    }
  }

  const authCount = TEMPLATES.filter((t) => t.kind === "auth").length;
  const notifCount = TEMPLATES.filter((t) => t.kind === "notification").length;
  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

  console.log(`\nPATCH ${url}`);
  console.log(`Pushing ${authCount} auth + ${notifCount} notification templates...`);

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    console.log(`\n✓ Successfully pushed to Supabase (HTTP ${res.status})`);
  } else {
    const body = await res.text();
    console.error(`\n✗ Supabase API error (HTTP ${res.status}):`);
    console.error(body);
    Deno.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const PUSH = Deno.args.includes("--push");

console.log("Future Together — Supabase email template generator");
console.log("====================================================\n");

console.log("Generating HTML files...");
await generateFiles();

if (PUSH) {
  console.log("\nPushing to Supabase Auth API...");
  await pushToSupabase();
} else {
  console.log("\nTip: pass --push to deploy templates to the Supabase Auth API.");
  console.log("     Requires: PROJECT_REF and SUPABASE_ACCESS_TOKEN env vars.");
}
