import { page } from "fresh";
import { define } from "@/utils.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";

/**
 * Signup page — /signup
 *
 * Collects display name, email, password, and age confirmation (16+).
 * On success, Supabase sends a confirmation email; shows a success message.
 * The auth trigger (migration 002) creates a profiles table row on confirmation.
 */

interface SignupData {
  error: string | null;
  success: boolean;
  formValues: {
    nameFirst: string;
    nameLast: string;
    email: string;
  };
}

export const handler = define.handlers<SignupData>({
  GET(_ctx) {
    return page({
      error: null,
      success: false,
      formValues: { nameFirst: "", nameLast: "", email: "" },
    });
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const nameFirst = (form.get("name_first") as string ?? "").trim();
    const nameLast = (form.get("name_last") as string ?? "").trim();
    const email = (form.get("email") as string ?? "").trim();
    const password = form.get("password") as string ?? "";
    const ageConfirmed = form.get("age_confirmed") === "on";

    if (!nameFirst) {
      return page({
        error: "Please enter your first name.",
        success: false,
        formValues: { nameFirst, nameLast, email },
      });
    }
    if (!nameLast) {
      return page({
        error: "Please enter your last name.",
        success: false,
        formValues: { nameFirst, nameLast, email },
      });
    }
    if (!email) {
      return page({
        error: "Please enter your email address.",
        success: false,
        formValues: { nameFirst, nameLast, email },
      });
    }
    if (!password || password.length < 8) {
      return page({
        error: "Password must be at least 8 characters.",
        success: false,
        formValues: { nameFirst, nameLast, email },
      });
    }
    if (!ageConfirmed) {
      return page({
        error:
          "You must confirm that you are 16 years of age or older to create an account.",
        success: false,
        formValues: { nameFirst, nameLast, email },
      });
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
        },
      },
    });

    if (error) {
      return page({
        error: error.message,
        success: false,
        formValues: { nameFirst, nameLast, email },
      });
    }

    return page({
      error: null,
      success: true,
      formValues: { nameFirst: "", nameLast: "", email: "" },
    });
  },
});

export default define.page<typeof handler>(function SignupPage({ data }) {
  const { error, success, formValues } = data;

  return (
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
                We've sent a confirmation link. Click it to activate your
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
  );
});
