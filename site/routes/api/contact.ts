import { FreshContext } from "fresh";
import { buildEmailHtml, FROM_EMAIL, FROM_NAME, sendEmail } from "@/utils/email.ts";

interface ContactFormData {
  name: string;
  email: string;
  topic?: string;
  heard_from?: string;
  message: string;
  source?: string;
  turnstile_token?: string;
}

export const handler = async (ctx: FreshContext) => {
  if (ctx.req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data: ContactFormData = await ctx.req.json();

    // Validate required fields
    if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
      return new Response("Missing required fields", { status: 400 });
    }

    const contactEmail = Deno.env.get("FT_CONTACT_EMAIL") ?? FROM_EMAIL;
    const topic = data.topic ?? "General";

    // -------------------------------------------------------------------------
    // Admin notification — full details including message
    // -------------------------------------------------------------------------
    const adminHtml = `
      <h2 style="margin:0 0 20px;color:#1c1a18;font-size:20px;">New Contact Form Submission</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Name</strong></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">${data.name}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Email</strong></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
        ${data.topic ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Topic</strong></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">${data.topic}</td></tr>` : ""}
        ${data.heard_from ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Found us via</strong></td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">${data.heard_from}</td></tr>` : ""}
        ${data.source ? `<tr><td style="padding:10px 0;"><strong>Source</strong></td><td style="padding:10px 0 10px 16px;">${data.source}</td></tr>` : ""}
      </table>
      <h3 style="margin:24px 0 8px;color:#1c1a18;">Message</h3>
      <p style="margin:0;white-space:pre-wrap;color:#374151;line-height:1.6;">${
        data.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      }</p>`;

    const adminOk = await sendEmail({
      to: contactEmail,
      subject: `Future Together Contact: ${topic}`,
      html: buildEmailHtml(adminHtml, `New message from ${data.name}`),
      replyTo: data.email,
    });

    if (!adminOk) {
      return new Response("Failed to send email", { status: 500 });
    }

    // -------------------------------------------------------------------------
    // User confirmation — no message content (prevents reply-chain abuse)
    // -------------------------------------------------------------------------
    const firstName = data.name.trim().split(/\s+/)[0];
    const confirmHtml = `
      <p style="margin:0 0 20px;font-size:17px;color:#1c1a18;">Hi ${firstName},</p>
      <p style="margin:0 0 16px;color:#374151;">
        Thanks for reaching out — we’ve received your message and will get back to you soon.
      </p>
      <p style="margin:0 0 24px;color:#374151;">
        In the meantime, if you’d like to connect with others thinking about these questions,
        our monthly online meetups are a great place to start.
      </p>
      <p style="text-align:center;margin:0 0 32px;">
        <a href="https://futuretogether.community/meetups" class="btn">See upcoming meetups</a>
      </p>
      <p style="margin:0;color:#6b7280;font-size:13px;">
        If you didn’t send this message, you can safely ignore this email.
      </p>`;

    // Fire-and-forget — don’t fail the request if the confirmation email bounces
    sendEmail({
      to: data.email,
      subject: `We got your message — ${FROM_NAME}`,
      html: buildEmailHtml(confirmHtml, `Thanks for reaching out to ${FROM_NAME}.`),
    }).catch((err) => console.error("Contact confirmation email error:", err));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};
