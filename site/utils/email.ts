/**
 * Shared email utilities for Future Together.
 * All outbound email goes through sendEmail().
 * buildEmailHtml() wraps content in the branded template.
 */

export const RESEND_API_KEY = Deno.env.get("FT_RESEND_API_KEY");
export const FROM_EMAIL =
  Deno.env.get("FT_RESEND_FROM_EMAIL") ?? "hello@futuretogether.community";
export const FROM_NAME = Deno.env.get("FT_RESEND_FROM_NAME") ?? "Future Together";
export const SITE_URL = "https://futuretogether.community";
export const LOGO_URL = `${SITE_URL}/logo-white.svg`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailAttachment {
  filename: string;
  content: string; // base64-encoded
  type?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

/** Send an email via Resend. Returns true on success. */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("FT_RESEND_API_KEY not configured");
    return false;
  }

  try {
    const body: Record<string, unknown> = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
    if (options.text) body.text = options.text;
    if (options.replyTo) body.reply_to = options.replyTo;
    if (options.attachments?.length) body.attachments = options.attachments;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("Resend API error:", await response.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Branded HTML template
// ---------------------------------------------------------------------------

/**
 * Wraps an HTML content block in the Future Together branded email shell.
 *
 * @param content  Inner HTML (table rows, paragraphs, etc.) — no wrapper needed.
 * @param preheader  Short preview text shown by email clients before opening.
 */
export function buildEmailHtml(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
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
    a { color: #1a5f6e; }
    .btn { display: inline-block; background-color: #c4853a; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; }
    .btn-teal { background-color: #1a5f6e; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #e8e3db; }
    .detail-row:last-child { border-bottom: none; }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}

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
              ${content}
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
</html>`;
}
