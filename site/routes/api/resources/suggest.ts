import { define } from "@/utils.ts";
import {
  buildEmailHtml,
  FROM_EMAIL,
  FROM_NAME,
  sendEmail,
} from "@/utils/email.ts";

interface SuggestionData {
  url: string;
  title: string;
  why: string;
  category?: string;
  name?: string;
  email?: string;
}

export const handlers = define.handlers({
  async POST(ctx) {
    try {
      const data: SuggestionData = await ctx.req.json();

      // Validate required fields
      if (!data.url?.trim() || !data.title?.trim() || !data.why?.trim()) {
        return new Response("Missing required fields", { status: 400 });
      }

      // Basic URL sanity check
      try {
        new URL(data.url.trim());
      } catch {
        return new Response("Please enter a valid URL", { status: 400 });
      }

      const adminEmail = Deno.env.get("FT_CONTACT_EMAIL") ?? FROM_EMAIL;

      const escape = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const adminHtml = `
        <h2 style="margin:0 0 20px;color:#1c1a18;font-size:20px;">New Resource Suggestion</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8e3db;width:120px;"><strong>Title</strong></td>
            <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">${
        escape(data.title.trim())
      }</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>URL</strong></td>
            <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">
              <a href="${escape(data.url.trim())}">${
        escape(data.url.trim())
      }</a>
            </td>
          </tr>
          ${
        data.category
          ? `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Category</strong></td>
            <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">${
            escape(data.category)
          }</td>
          </tr>`
          : ""
      }
          ${
        data.name
          ? `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>From</strong></td>
            <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">${
            escape(data.name)
          }${
            data.email
              ? ` &lt;<a href="mailto:${escape(data.email)}">${
                escape(data.email)
              }</a>&gt;`
              : ""
          }</td>
          </tr>`
          : (data.email
            ? `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Email</strong></td>
            <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">
              <a href="mailto:${escape(data.email)}">${escape(data.email)}</a>
            </td>
          </tr>`
            : "")
      }
        </table>
        <h3 style="margin:24px 0 8px;color:#1c1a18;">Why they recommend it</h3>
        <p style="margin:0;white-space:pre-wrap;color:#374151;line-height:1.6;">${
        escape(data.why.trim())
      }</p>`;

      const submitterLabel = data.name
        ? data.name
        : data.email
        ? data.email
        : "Anonymous";
      const subject =
        `Resource suggestion from ${submitterLabel}: ${data.title.trim()}`;

      const ok = await sendEmail({
        to: adminEmail,
        subject,
        html: buildEmailHtml(
          adminHtml,
          `${submitterLabel} suggested a resource for Future Together.`,
        ),
        replyTo: data.email,
      });

      if (!ok) {
        return new Response("Failed to send — please try again shortly", {
          status: 500,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Resource suggestion error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
});
