import { useState } from "preact/hooks";

interface Props {
  redirect: string;
  error: string | null;
  noAccount: boolean;
  magicLinkSent: boolean;
  sentToEmail: string;
  initialMode: "password" | "magic";
}

/**
 * LoginForm island — handles tab switching and OTP code entry.
 * All auth submissions POST to the server; this island only manages UI state.
 */
export default function LoginForm(
  { redirect, error, noAccount, magicLinkSent, sentToEmail, initialMode }:
    Props,
) {
  const [mode, setMode] = useState<"password" | "magic">(initialMode);

  const tabStyle = (active: boolean) => ({
    borderBottomColor: active ? "#1a5f6e" : "transparent",
    color: active ? "#1a5f6e" : "#6b7280",
  });

  return (
    <>
      {/* No account — softer CTA, not a red error */}
      {noAccount && (
        <div class="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm">
          No account found for that email.{" "}
          <a href="/join" class="font-semibold underline hover:opacity-80">
            Join Future Together →
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Magic link sent — show confirmation + OTP code entry */}
      {magicLinkSent && (
        <div class="space-y-5">
          <div class="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
            <strong>Check your email.</strong>{" "}
            We’ve sent a login link — it expires in 1 hour.
          </div>

          <div class="border border-gray-200 rounded-lg p-4">
            <p class="text-sm font-medium text-gray-700 mb-3">
              Or enter the code from the email:
            </p>
            <form method="POST" class="flex gap-2">
              <input type="hidden" name="mode" value="otp" />
              <input type="hidden" name="email" value={sentToEmail} />
              <input type="hidden" name="redirect" value={redirect} />
              <input
                type="text"
                name="code"
                required
                maxLength={8}
                pattern="[0-9]{8}"
                inputMode="numeric"
                autocomplete="one-time-code"
                placeholder="00000000"
                class="w-42 px-3 py-2.5 border border-gray-300 rounded-lg text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              <button
                type="submit"
                class="px-4 py-2.5 text-white text-sm font-semibold bg-primary rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap"
              >
                Verify code
              </button>
            </form>
          </div>
        </div>
      )}

      {!magicLinkSent && (
        <>
          {/* Mode tabs */}
          <div class="flex border-b-2 border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => setMode("password")}
              class="pb-2 px-1 mr-6 text-sm font-semibold border-b-2 -mb-px bg-transparent cursor-pointer"
              style={tabStyle(mode === "password")}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode("magic")}
              class="pb-2 px-1 text-sm font-semibold border-b-2 -mb-px bg-transparent cursor-pointer"
              style={tabStyle(mode === "magic")}
            >
              Email link
            </button>
          </div>

          {/* Password form */}
          {mode === "password" && (
            <form method="POST">
              <input type="hidden" name="mode" value="password" />
              <input type="hidden" name="redirect" value={redirect} />
              <div class="mb-4">
                <label
                  for="email-pw"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email-pw"
                  name="email"
                  required
                  autocomplete="email"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-teal-700"
                />
              </div>
              <div class="mb-4">
                <label
                  for="password-pw"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password-pw"
                  name="password"
                  required
                  autocomplete="current-password"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none"
                />
              </div>
              <div class="flex items-center mb-6">
                <input
                  type="checkbox"
                  id="remember-me"
                  name="remember_me"
                  value="on"
                  class="w-4 h-4 cursor-pointer"
                  style="accent-color: #1a5f6e;"
                />
                <label
                  for="remember-me"
                  class="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  Remember me for 30 days
                </label>
              </div>
              <button
                type="submit"
                class="w-full py-3 text-white font-semibold bg-primary rounded-lg transition-opacity hover:opacity-90"
              >
                Sign in
              </button>
            </form>
          )}

          {/* Magic link form */}
          {mode === "magic" && (
            <form method="POST">
              <input type="hidden" name="mode" value="magic" />
              <input type="hidden" name="redirect" value={redirect} />
              <div class="mb-4">
                <label
                  for="email-magic"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email-magic"
                  name="email"
                  required
                  autocomplete="email"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none"
                />
              </div>
              <p class="text-xs text-gray-500 mb-6">
                We’ll email you a secure link and a 8-digit code — no password
                needed.
              </p>
              <button
                type="submit"
                class="w-full py-3 text-white font-semibold bg-primary rounded-lg transition-opacity hover:opacity-90"
              >
                Send login link
              </button>
            </form>
          )}
        </>
      )}

      <p class="text-center mt-6 text-sm text-gray-500">
        Don’t have an account?{" "}
        <a href="/signup" class="font-medium text-primary">Create one</a>
      </p>
    </>
  );
}
