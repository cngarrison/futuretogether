import { page } from "fresh";
import { define } from "@/utils.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { getProfileByEmail } from "@/utils/db/profiles.ts";
import {
  getSessionFromRequest,
  getUserFromToken,
  isSiteAdmin,
  setSessionCookies,
} from "@/utils/auth.ts";
import LoginForm from "@/islands/LoginForm.tsx";

/**
 * Login page — /login
 *
 * Server handles authentication logic (password sign-in, magic link dispatch).
 * Tab switching (password ↔ magic link) is handled client-side by the LoginForm island.
 */

interface LoginData {
  redirect: string;
  error: string | null;
  noAccount: boolean;
  magicLinkSent: boolean;
  sentToEmail: string;
  initialMode: "password" | "magic";
}

export const handler = define.handlers<LoginData>({
  async GET(ctx) {
    // Already authenticated — redirect based on role (honouring ?next= if present)
    const token = getSessionFromRequest(ctx.req);
    const next = ctx.url.searchParams.get("next") ??
      ctx.url.searchParams.get("redirect") ?? null;
    if (token) {
      const user = await getUserFromToken(token);
      if (user) {
        const destination = next ??
          (await isSiteAdmin(user.id) ? "/admin/" : "/account/");
        return new Response(null, {
          status: 302,
          headers: { Location: destination },
        });
      }
    }

    const redirect = next ?? "/account/";
    const error = ctx.url.searchParams.get("error") === "auth_failed"
      ? "Authentication failed. Please try again."
      : null;
    return page({
      redirect,
      error,
      noAccount: false,
      magicLinkSent: false,
      sentToEmail: "",
      initialMode: "magic",
    });
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const mode = (form.get("mode") as string) ?? "magic";
    const email = (form.get("email") as string ?? "").trim();
    const redirect = (form.get("redirect") as string ?? "") || "/admin/";

    // -------------------------------------------------------------------------
    // Magic link flow
    // -------------------------------------------------------------------------
    if (mode === "magic") {
      if (!email) {
        return page({
          redirect,
          error: "Please enter your email address.",
          noAccount: false,
          magicLinkSent: false,
          sentToEmail: "",
          initialMode: "magic",
        });
      }

      // Check the user exists before sending a magic link — prevents auto-account creation
      const existingProfile = await getProfileByEmail(email);
      if (!existingProfile) {
        return page({
          redirect,
          error: null,
          noAccount: true,
          magicLinkSent: false,
          sentToEmail: "",
          initialMode: "magic",
        });
      }

      const callbackUrl = new URL("/auth/callback", ctx.req.url);
      callbackUrl.searchParams.set("next", redirect);
      const emailRedirectTo = callbackUrl.href;
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo, shouldCreateUser: false },
      });

      if (error) {
        return page({
          redirect,
          error: error.message,
          noAccount: false,
          magicLinkSent: false,
          sentToEmail: "",
          initialMode: "magic",
        });
      }

      return page({
        redirect,
        error: null,
        noAccount: false,
        magicLinkSent: true,
        sentToEmail: email,
        initialMode: "magic",
      });
    }

    // -------------------------------------------------------------------------
    // OTP code flow (8-digit code from magic link email)
    // -------------------------------------------------------------------------
    if (mode === "otp") {
      const code = (form.get("code") as string ?? "").trim();
      if (!email || !code) {
        return page({
          redirect,
          error: "Please enter your email and the code from your email.",
          noAccount: false,
          magicLinkSent: false,
          sentToEmail: "",
          initialMode: "magic",
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
          redirect,
          error: error?.message ??
            "Invalid or expired code. Please request a new login link.",
          noAccount: false,
          magicLinkSent: false,
          sentToEmail: "",
          initialMode: "magic",
        });
      }

      const headers = new Headers();
      setSessionCookies(headers, data.session, false);
      headers.set("Location", redirect);
      return new Response(null, { status: 302, headers });
    }

    // -------------------------------------------------------------------------
    // Email/password flow
    // -------------------------------------------------------------------------
    const password = (form.get("password") as string) ?? "";
    const rememberMe = form.get("remember_me") === "on";

    if (!email || !password) {
      return page({
        redirect,
        error: "Please enter your email and password.",
        noAccount: false,
        magicLinkSent: false,
        sentToEmail: "",
        initialMode: "password",
      });
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return page({
        redirect,
        error: error?.message ??
          "Sign in failed. Please check your credentials.",
        noAccount: false,
        magicLinkSent: false,
        sentToEmail: "",
        initialMode: "password",
      });
    }

    const headers = new Headers();
    setSessionCookies(headers, data.session, rememberMe);
    headers.set("Location", redirect);
    return new Response(null, { status: 302, headers });
  },
});

export default define.page<typeof handler>(function LoginPage({ data }) {
  return (
    <div class="flex items-center justify-center py-16 px-4 mt-8">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-10">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-primary">Sign in</h1>
          <p class="mt-1 text-sm text-gray-500">
            to your Future Together account
          </p>
        </div>
        <LoginForm {...data} />
        <div class="mt-6 space-y-2 text-center">
          <p class="text-sm text-gray-500">
            New here?{" "}
            <a
              f-client-nav={false}
              href="/join"
              class="font-medium text-primary"
            >
              Join Future Together &rarr;
            </a>
          </p>
          <p>
            <a
              f-client-nav={false}
              href="/auth/forgot-password"
              class="text-xs"
              style="color: rgba(28,26,24,0.45);"
            >
              Forgot your password?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
});
