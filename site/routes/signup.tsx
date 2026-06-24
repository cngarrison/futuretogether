import { Head } from "fresh/runtime";
import { page } from "fresh";
import { define } from "@/utils.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import {
  getTurnstileSiteKey,
  verifyTurnstileToken,
} from "@/utils/turnstile.ts";
import { generateFormToken, verifyFormToken } from "@/utils/form-token.ts";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit.ts";

/**
 * Signup page — /signup
 *
 * Collects first name, last name, email, password, and age confirmation (16+).
 * On success, Supabase sends a confirmation email; shows a success message.
 * The auth trigger (migration 002) creates a profiles row on confirmation.
 *
 * Bot protections (layered):
 *   1. Honeypot field — hidden from humans, filled by automated form fillers
 *   2. IP rate limiting — max 3 attempts per IP per hour (Deno KV)
 *   3. Timing token — HMAC-signed timestamp; rejects submissions < 4 seconds after page load
 *   4. Cloudflare Turnstile — rendered when FT_TURNSTILE_SITE_KEY is configured
 */

interface SignupData {
  error: string | null;
  success: boolean;
  formValues: {
    nameFirst: string;
    nameLast: string;
    email: string;
  };
  turnstileSiteKey?: string;
  formToken?: string;
}

export const handler = define.handlers<SignupData>({
  async GET(_ctx) {
    return page({
      error: null,
      success: false,
      formValues: { nameFirst: "", nameLast: "", email: "" },
      turnstileSiteKey: getTurnstileSiteKey(),
      formToken: (await generateFormToken()) ?? undefined,
    });
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const nameFirst = (form.get("name_first") as string ?? "").trim();
    const nameLast = (form.get("name_last") as string ?? "").trim();
    const email = (form.get("email") as string ?? "").trim();
    const password = (form.get("password") as string) ?? "";
    const ageConfirmed = form.get("age_confirmed") === "on";
    const hpWebsite = (form.get("hp_website") as string) ?? "";
    const formTokenValue = (form.get("form_token") as string) ?? "";
    const turnstileResponse = (form.get("cf-turnstile-response") as string) ??
      "";

    const turnstileSiteKey = getTurnstileSiteKey();

    // Re-render the form with an error message and a fresh timing token.
    const errorPage = async (error: string) =>
      page({
        error,
        success: false,
        formValues: { nameFirst, nameLast, email },
        turnstileSiteKey,
        formToken: (await generateFormToken()) ?? undefined,
      });

    // 1. Honeypot — real users never fill this; return fake success to bots.
    if (hpWebsite) {
      console.warn("Honeypot triggered on /signup — discarding bot submission");
      return page({
        error: null,
        success: true,
        formValues: { nameFirst: "", nameLast: "", email: "" },
        turnstileSiteKey,
      });
    }

    // 2. IP rate limit — max 3 signup attempts per IP per hour.
    const clientIp = getClientIp(ctx.req);
    if (!await checkRateLimit(clientIp)) {
      return errorPage("Too many signup attempts. Please try again later.");
    }

    // 3. Timing token — rejects automated fast-submit and forged tokens.
    if (!await verifyFormToken(formTokenValue || undefined)) {
      return errorPage(
        "Form verification failed. Please refresh the page and try again.",
      );
    }

    // 4. Turnstile captcha (skipped in local dev when key is not configured).
    if (!await verifyTurnstileToken(turnstileResponse)) {
      return errorPage("Captcha verification failed. Please try again.");
    }

    // Field validation.
    if (!nameFirst) return errorPage("Please enter your first name.");
    if (!nameLast) return errorPage("Please enter your last name.");
    if (!email) return errorPage("Please enter your email address.");
    if (!password || password.length < 8) {
      return errorPage("Password must be at least 8 characters.");
    }
    if (!ageConfirmed) {
      return errorPage(
        "You must confirm that you are 16 years of age or older to create an account.",
      );
    }

    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name_first: nameFirst,
          name_last: nameLast,
          has_password: true,
          source_form: "signup-form",
        },
      },
    });

    if (error) {
      return errorPage(error.message);
    }

    return page({
      error: null,
      success: true,
      formValues: { nameFirst: "", nameLast: "", email: "" },
      turnstileSiteKey,
    });
  },
});

export default define.page<typeof handler>(function SignupPage({ data }) {
  const { error, success, formValues, turnstileSiteKey, formToken } = data;

  return (
    <>
      {turnstileSiteKey && (
        <Head>
          <script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            async
            defer
          />
        </Head>
      )}

      <div class="flex items-center justify-center py-16 px-4 mt-8">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-10">
          <div class="text-center mb-8">
            <h1 class="text-2xl font-bold text-primary">Create account</h1>
            <p class="mt-1 text-sm text-gray-500">Join Future Together</p>
          </div>

          {success
            ? (
              <div class="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center">
                <p class="font-semibold mb-1">Check your email!</p>
                <p class="text-sm">
                  We’ve sent a confirmation link. Click it to activate your
                  account.
                </p>
              </div>
            )
            : (
              <>
                {error && (
                  <div class="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form method="POST">
                  {/* Timing token — HMAC-signed timestamp, verified server-side */}
                  <input
                    type="hidden"
                    name="form_token"
                    value={formToken ?? ""}
                  />

                  {/* Honeypot — visually hidden, only bots fill this in */}
                  <div
                    aria-hidden="true"
                    style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;"
                  >
                    <label for="hp_website">Website</label>
                    <input
                      type="text"
                      id="hp_website"
                      name="hp_website"
                      tabIndex={-1}
                      autocomplete="off"
                    />
                  </div>

                  <div class="mb-4">
                    <label
                      for="name_first"
                      class="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First name
                    </label>
                    <input
                      type="text"
                      id="name_first"
                      name="name_first"
                      required
                      value={formValues.nameFirst}
                      autocomplete="given-name"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none"
                    />
                  </div>

                  <div class="mb-4">
                    <label
                      for="name_last"
                      class="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last name
                    </label>
                    <input
                      type="text"
                      id="name_last"
                      name="name_last"
                      required
                      value={formValues.nameLast}
                      autocomplete="family-name"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none"
                    />
                  </div>

                  <div class="mb-4">
                    <label
                      for="email"
                      class="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formValues.email}
                      autocomplete="email"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none"
                    />
                  </div>

                  <div class="mb-4">
                    <label
                      for="password"
                      class="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password
                      <span class="ml-2 text-xs text-gray-400 font-normal">
                        (min 8 characters)
                      </span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      required
                      minlength={8}
                      autocomplete="new-password"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none"
                    />
                  </div>

                  <div class="flex items-start gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="age_confirmed"
                      name="age_confirmed"
                      required
                      class="mt-0.5 w-4 h-4 flex-shrink-0 cursor-pointer"
                      style="accent-color: #1a5f6e;"
                    />
                    <label
                      for="age_confirmed"
                      class="text-sm text-gray-700 cursor-pointer leading-snug"
                    >
                      I am 16 years of age or older
                    </label>
                  </div>

                  {/* Turnstile widget — only renders when sitekey is configured */}
                  {turnstileSiteKey && (
                    <div class="mb-4 flex justify-center">
                      <div
                        class="cf-turnstile"
                        data-sitekey={turnstileSiteKey}
                        data-theme="light"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    class="w-full py-3 text-white font-semibold bg-primary rounded-lg transition-opacity hover:opacity-90"
                  >
                    Create account
                  </button>
                </form>

                <p class="text-center mt-6 text-sm text-gray-500">
                  Already have an account?{" "}
                  <a href="/login" class="font-medium text-primary">Sign in</a>
                </p>
                <p
                  class="text-center mt-3 text-xs"
                  style="color: rgba(28,26,24,0.45);"
                >
                  Just joining the community?{" "}
                  <a href="/join" class="font-medium text-primary">
                    Join without a password &rarr;
                  </a>
                </p>
              </>
            )}
        </div>
      </div>
    </>
  );
});
