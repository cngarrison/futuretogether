import { FreshContext } from "fresh";

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

    // Get Resend API key from environment
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("FROM_EMAIL") ??
          "Future Together <hello@futuretogether.community>",
        to: Deno.env.get("CONTACT_EMAIL") ?? "hello@futuretogether.community",
        subject: `Future Together Contact: ${data.topic ?? "General"}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.topic ? `<p><strong>Topic:</strong> ${data.topic}</p>` : ""}
          ${data.heard_from ? `<p><strong>How they found us:</strong> ${data.heard_from}</p>` : ""}
          ${data.source ? `<p><strong>Source:</strong> ${data.source}</p>` : ""}
          <p><strong>Message:</strong></p>
          <p>${data.message.replace(/\n/g, "<br>")}</p>
        `,
        reply_to: data.email,
      }),
    });
    //console.log('ApiContact: resendResponse', response);

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return new Response("Failed to send email", { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};
