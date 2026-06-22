import { page } from "fresh";
import { define } from "@/utils.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { setSessionCookies } from "@/utils/auth.ts";

/**
 * Forgot password — /auth/forgot-password
 *
 * GET:        Render the email form.
 * POST magic: Send a magic link to the email (shouldCreateUser:false).
 *             Always shows the same confirmation screen regardless of
 *             whether the account exists (avoids account enumeration).
 * POST otp:   Accept the 6-digit OTP code from the email, verify it,
 *             set session cookies, and redirect to /account/.
 */

interface ForgotPasswordData {
  /** Email that was submitted — used to pre-fill the OTP form. */
  email: string;
  /** True after a magic link has been dispatched. */
  submitted: boolean;
  /** Validation / auth error for the email form. */
  error: string | null;
  /** Error message specific to OTP verification. */
  otpError: string | null;
}

export const handler = define.handlers<ForgotPasswordData>(
  {
    GET() {
      return page({ email: "", submitted: false, error: null, otpError: null });
    },

    async POST(ctx) {
      const form = await ctx.req.formData();
      const mode = form.get("mode") as string ?? "magic";
      const email = (form.get("email") as string ?? "").trim();

      // -----------------------------------------------------------------------
      // OTP verification — user entered 6-digit code from the email
      // -----------------------------------------------------------------------
      if (mode === "otp") {
        const code = (form.get("code") as string ?? "").trim();

        if (!email || !code) {
          return page({
            email,
            submitted: true,
            error: null,
            otpError: "Please enter the 6-digit code from your email.",
          });
        }

        const supabase = createSupabaseClient();
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: "email",
        });

        if (error || !data.session) {
          return page({
            email,
            submitted: true,
            error: null,
            otpError: error?.message ??
              "Invalid or expired code. Please request a new sign-in link.",
          });
        }

        const headers = new Headers();
        setSessionCookies(headers, data.session, false);
        headers.set("Location", "/account/");
        return new Response(null, { status: 302, headers });
      }

      // -----------------------------------------------------------------------
      // Magic link dispatch
      // -----------------------------------------------------------------------
      if (!email) {
        return page({
          email: "",
          submitted: false,
          error: "Please enter your email address.",
          otpError: null,
        });
      }

      const callbackUrl = new URL("/auth/callback", ctx.req.url);
      callbackUrl.searchParams.set("next", "/account/");

      const supabase = createSupabaseClient();
      // shouldCreateUser: false — only sends a link to existing accounts.
      // emailRedirectTo routes the magic link click through /auth/callback
      // with next=/account/ so the user lands on their account page.
      // Errors are intentionally suppressed to avoid revealing account existence.
      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: callbackUrl.href,
        },
      });

      return page({ email, submitted: true, error: null, otpError: null });
    },
  },
);

export default define.page<typeof handler>(function ForgotPasswordPage(
  { data },
) {
  const { email, submitted, error, otpError } = data;

  return (
    <>
      <head>
        <title>Forgot password — Future Together</title>
        <meta
          name="description"
          content="Request a sign-in link for your Future Together account."
        />
      </head>
      <div class="flex items-center justify-center py-16 px-4 mt-8">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-10">
          {submitted
            ? (
              <div class="space-y-6">
                {/* Confirmation message */}
                <div class="text-center space-y-3">
                  <div class="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-6 h-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width={2}
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h1 class="text-2xl font-bold text-primary">
                    Check your inbox
                  </h1>
                  <p class="text-gray-600 text-sm leading-relaxed">
                    If that email address is registered, we&rsquo;ve sent you a
                    sign-in link. It should arrive within a minute or two.
                  </p>
                  <p class="text-gray-500 text-xs">
                    Didn&rsquo;t get it? Check your spam folder, or{" "}
                    <a
                      href="/auth/forgot-password"
                      class="text-primary underline"
                    >
                      try again
                    </a>.
                  </p>
                </div>

                {/* Divider */}
                <div class="flex items-center gap-3">
                  <div class="flex-1 border-t border-gray-200" />
                  <span class="text-xs text-gray-400">or enter your code</span>
                  <div class="flex-1 border-t border-gray-200" />
                </div>

                {/* Inline OTP entry */}
                <div>
                  <p class="text-sm text-gray-600 mb-3">
                    Have the 6-digit code from the email?
                  </p>

                  {otpError && (
                    <div class="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {otpError}
                    </div>
                  )}

                  <form method="POST" class="flex gap-2">
                    <input type="hidden" name="mode" value="otp" />
                    <input type="hidden" name="email" value={email} />
                    <input
                      name="code"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]{8}"
                      maxlength={8}
                      required
                      autocomplete="one-time-code"
                      placeholder="00000000"
                      class="w-42 rounded-lg border border-gray-300 px-4 py-2.5 text-xl text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                    <button
                      type="submit"
                      class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                      Sign in &rarr;
                    </button>
                  </form>
                </div>
              </div>
            )
            : (
              <>
                <div class="text-center mb-8">
                  <h1 class="text-2xl font-bold text-primary">
                    Forgot your password?
                  </h1>
                  <p class="mt-2 text-sm text-gray-500 leading-relaxed">
                    Enter your email and we&rsquo;ll send you a magic sign-in
                    link. No password needed.
                  </p>
                </div>

                {error && (
                  <div class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form method="POST" class="space-y-5">
                  <input type="hidden" name="mode" value="magic" />
                  <div>
                    <label
                      for="email"
                      class="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autocomplete="email"
                      class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      placeholder="you@example.com"
                    />
                  </div>

                  <button
                    type="submit"
                    class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    Send sign-in link
                  </button>
                </form>
              </>
            )}

          <div class="mt-6 text-center">
            <a
              href="/login"
              class="text-xs"
              style="color: rgba(28,26,24,0.45);"
            >
              &larr; Back to sign in
            </a>
          </div>
        </div>
      </div>
    </>
  );
});
