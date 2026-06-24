import { page } from "fresh";
import { define } from "@/utils.ts";
import ConfirmSignIn from "@/islands/ConfirmSignIn.tsx";

/**
 * Auth confirm page — /auth/confirm
 *
 * Intermediate confirmation step for email-link auth flows. Email templates
 * link here (with token_hash + type as query params) rather than directly to
 * Supabase's verify endpoint. This page renders a button and only verifies
 * the token when the user clicks it.
 *
 * WHY:
 * Corporate email security scanners follow all links in incoming emails to
 * check for malware/phishing. If verification happened server-side on page
 * load, the scanner would consume the one-time token before the user sees it.
 * By deferring to a client-side button click, scanners (which don't execute
 * button clicks and mostly don't run JavaScript) cannot invalidate the token.
 *
 * The OTP code shown in the same email shares the same underlying token —
 * so this fix protects both the link and the code simultaneously.
 *
 * Supported types: magiclink, signup, recovery, invite
 */

interface PageData {
  tokenHash: string;
  type: string;
}

export const handler = define.handlers<PageData>({
  GET(ctx) {
    const url = new URL(ctx.req.url);
    const tokenHash = url.searchParams.get("token_hash") ?? "";
    const type = url.searchParams.get("type") ?? "magiclink";

    // Nothing to confirm — redirect to login.
    if (!tokenHash) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login?error=auth_failed" },
      });
    }

    return page({ tokenHash, type });
  },
});

export default define.page<typeof handler>(function ConfirmPage({ data }) {
  const { tokenHash, type } = data as PageData;

  const heading =
    type === "signup"
      ? "Confirm your email"
      : type === "recovery"
        ? "Reset your password"
        : type === "invite"
          ? "Accept your invitation"
          : "Sign in to Future Together";

  const subtext =
    type === "signup"
      ? "Click below to confirm your email address and finish creating your account."
      : type === "recovery"
        ? "Click below to verify your identity and continue to password reset."
        : type === "invite"
          ? "Click below to accept your invitation and set up your account."
          : "Click below to complete your sign-in.";

  return (
    <div class="flex items-center justify-center py-16 px-4 mt-8">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-10">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-primary">{heading}</h1>
          <p class="mt-2 text-sm text-gray-500">{subtext}</p>
        </div>
        <ConfirmSignIn tokenHash={tokenHash} type={type} />
      </div>
    </div>
  );
});
