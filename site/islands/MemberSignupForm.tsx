/**
 * MemberSignupForm island — membership registration form for the /join page.
 *
 * Submits to POST /api/members/register.
 * Fields: first name, last name, email, location (optional), how-heard (select),
 *         interests (multi-select checkboxes), wants-to-organise (checkbox),
 *         age-confirmed (required), Turnstile captcha.
 *
 * Uses Supabase signInWithOtp under the hood — new users are created and sent
 * a confirmation link; existing users receive a sign-in link. Both look identical
 * here (privacy by design).
 */

import { useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import TurnstileWidget from "./TurnstileWidget.tsx";

const INTEREST_OPTIONS = [
  "Work and the economy",
  "AI safety and alignment",
  "Community building",
  "Local action and preparedness",
  "Governance and policy",
  "Philosophy and ethics",
  "Education and learning",
  "The future of technology",
];

const HEARD_FROM_OPTIONS = [
  { value: "", label: "How did you find us?" },
  { value: "meetup", label: "Attended a meetup" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "x-twitter", label: "X (Twitter)" },
  { value: "word-of-mouth", label: "Friend or colleague" },
  { value: "poster", label: "Local poster or flyer" },
  { value: "blog", label: "Blog or article" },
  { value: "Meetup.com", label: "Meetup.com" },
  { value: "search", label: "Web search" },
  { value: "Other", label: "Other" },
];

type Status = "idle" | "submitting" | "success" | "error";

interface Props {
  turnstileSiteKey?: string;
  /** Signed timing token generated at page render time — verified server-side. */
  formToken?: string;
  /** UUID of a group to auto-join on account creation (passed from /join?group_id=). */
  groupId?: string;
  /** Post-confirmation redirect path (passed through emailRedirectTo). */
  nextUrl?: string;
}

export default function MemberSignupForm(
  { turnstileSiteKey, formToken, groupId, nextUrl }: Props,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstName = useSignal("");
  const lastName = useSignal("");
  const email = useSignal("");
  const location = useSignal("");
  const heardFrom = useSignal("");
  const selectedInterests = useSignal<string[]>([]);
  const wantsToOrganise = useSignal(false);
  const ageConfirmed = useSignal(false);
  const status = useSignal<Status>("idle");
  const errorMessage = useSignal("");
  const turnstileToken = useSignal("");
  const turnstileError = useSignal("");
  const honeypot = useSignal("");

  function toggleInterest(interest: string) {
    const current = selectedInterests.value;
    if (current.includes(interest)) {
      selectedInterests.value = current.filter((i) => i !== interest);
    } else {
      selectedInterests.value = [...current, interest];
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (status.value === "submitting") return;

    // Client-side age check before anything else
    if (!ageConfirmed.value) {
      errorMessage.value =
        "Please confirm that you are 16 years of age or older.";
      status.value = "error";
      return;
    }

    status.value = "submitting";
    errorMessage.value = "";

    // Client-side Turnstile guard
    if (turnstileSiteKey && !turnstileToken.value) {
      errorMessage.value = "Please complete the captcha verification.";
      status.value = "error";
      return;
    }

    try {
      const res = await fetch("/api/members/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.value.trim(),
          lastName: lastName.value.trim(),
          email: email.value.trim(),
          location: location.value.trim() || undefined,
          heardFrom: heardFrom.value || undefined,
          interests: selectedInterests.value,
          wantsToOrganise: wantsToOrganise.value,
          ageConfirmed: ageConfirmed.value,
          hp_website: honeypot.value || undefined,
          form_token: formToken,
          turnstile_token: turnstileToken.value || undefined,
          group_id: groupId || undefined,
          next: nextUrl || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        status.value = "success";
        setTimeout(
          () =>
            containerRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            }),
          50,
        );
      } else {
        errorMessage.value = data.error ??
          "Something went wrong. Please try again.";
        status.value = "error";
      }
    } catch {
      errorMessage.value =
        "Network error. Please check your connection and try again.";
      status.value = "error";
    }
  }

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------
  if (status.value === "success") {
    return (
      <div ref={containerRef}>
        <div class="text-center py-6">
          <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-white bg-primary text-2xl">
            ✓
          </div>
          <h3 class="text-xl font-bold mb-2 text-near-black">
            Check your email
          </h3>
          <p class="text-sm leading-relaxed" style="color: rgba(28,26,24,0.7);">
            We've sent a confirmation link to{" "}
            <strong>{email.value}</strong>. Click it to activate your account
            and complete joining Future Together.
            {wantsToOrganise.value &&
              " We'll also be in touch about running a local group."}
          </p>
          <p class="text-xs mt-3" style="color: rgba(28,26,24,0.45);">
            Can't find it? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const isSubmitting = status.value === "submitting";

  return (
    <div ref={containerRef}>
      <form onSubmit={handleSubmit} class="space-y-4">
        {/* Name row */}
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label
              class="block text-xs font-semibold mb-1"
              style="color: rgba(28,26,24,0.6);"
            >
              First name *
            </label>
            <input
              type="text"
              required
              autocomplete="given-name"
              value={firstName.value}
              onInput={(e) =>
                firstName.value = (e.target as HTMLInputElement).value}
              class="w-full px-3 py-2 rounded-lg text-sm border"
              style="border-color: #d0e4e7; outline: none;"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              class="block text-xs font-semibold mb-1"
              style="color: rgba(28,26,24,0.6);"
            >
              Last name *
            </label>
            <input
              type="text"
              required
              autocomplete="family-name"
              value={lastName.value}
              onInput={(e) =>
                lastName.value = (e.target as HTMLInputElement).value}
              class="w-full px-3 py-2 rounded-lg text-sm border"
              style="border-color: #d0e4e7; outline: none;"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            class="block text-xs font-semibold mb-1"
            style="color: rgba(28,26,24,0.6);"
          >
            Email address *
          </label>
          <input
            type="email"
            required
            autocomplete="email"
            value={email.value}
            onInput={(e) => email.value = (e.target as HTMLInputElement).value}
            class="w-full px-3 py-2 rounded-lg text-sm border"
            style="border-color: #d0e4e7; outline: none;"
            disabled={isSubmitting}
          />
        </div>

        {/* Location + How heard */}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              class="block text-xs font-semibold mb-1"
              style="color: rgba(28,26,24,0.6);"
            >
              City or region
              <span style="color: rgba(28,26,24,0.4); font-weight:400;">
                {" "}(optional)
              </span>
            </label>
            <input
              type="text"
              autocomplete="address-level2"
              placeholder="e.g. Melbourne"
              value={location.value}
              onInput={(e) =>
                location.value = (e.target as HTMLInputElement).value}
              class="w-full px-3 py-2 rounded-lg text-sm border"
              style="border-color: #d0e4e7; outline: none;"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              class="block text-xs font-semibold mb-1"
              style="color: rgba(28,26,24,0.6);"
            >
              How did you find us?
              <span style="color: rgba(28,26,24,0.4); font-weight:400;">
                {" "}(optional)
              </span>
            </label>
            <select
              value={heardFrom.value}
              onChange={(e) =>
                heardFrom.value = (e.target as HTMLSelectElement).value}
              class="w-full px-3 py-2 rounded-lg text-sm border"
              style="border-color: #d0e4e7; outline: none;"
              disabled={isSubmitting}
            >
              {HEARD_FROM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Interests */}
        <div>
          <p
            class="text-xs font-semibold mb-2"
            style="color: rgba(28,26,24,0.6);"
          >
            Topics you care about
            <span style="color: rgba(28,26,24,0.4); font-weight:400;">
              {" "}(optional)
            </span>
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {INTEREST_OPTIONS.map((interest) => {
              const checked = selectedInterests.value.includes(interest);
              return (
                <label
                  key={interest}
                  class="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors"
                  style={checked
                    ? "background-color: #eef5f7; color: #1a5f6e;"
                    : "background-color: transparent; color: rgba(28,26,24,0.75);"}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleInterest(interest)}
                    disabled={isSubmitting}
                    class="rounded"
                    style="accent-color: #1a5f6e;"
                  />
                  {interest}
                </label>
              );
            })}
          </div>
        </div>

        {/* Organiser opt-in */}
        <label
          class="flex items-start gap-3 cursor-pointer rounded-xl p-4"
          style={wantsToOrganise.value
            ? "background-color: #fef9ec; border: 1.5px solid #c4853a;"
            : "background-color: #f7f4ef; border: 1.5px solid transparent;"}
        >
          <input
            type="checkbox"
            checked={wantsToOrganise.value}
            onChange={(e) =>
              wantsToOrganise.value = (e.target as HTMLInputElement).checked}
            disabled={isSubmitting}
            class="mt-0.5 rounded flex-shrink-0"
            style="accent-color: #c4853a;"
          />
          <div>
            <span class="text-sm font-semibold text-near-black">
              I want to run a local group in my area
            </span>
            <p class="text-xs mt-0.5" style="color: rgba(28,26,24,0.6);">
              We'll follow up with resources and support to help you get
              started.
            </p>
          </div>
        </label>

        {/* Age confirmation — required */}
        <label
          class="flex items-start gap-3 cursor-pointer rounded-xl p-4"
          style={ageConfirmed.value
            ? "background-color: #eef5f7; border: 1.5px solid #1a5f6e;"
            : "background-color: #f7f4ef; border: 1.5px solid transparent;"}
        >
          <input
            type="checkbox"
            checked={ageConfirmed.value}
            onChange={(e) =>
              ageConfirmed.value = (e.target as HTMLInputElement).checked}
            disabled={isSubmitting}
            class="mt-0.5 rounded flex-shrink-0"
            style="accent-color: #1a5f6e;"
          />
          <div>
            <span class="text-sm font-semibold text-near-black">
              I am 16 years of age or older *
            </span>
            <p class="text-xs mt-0.5" style="color: rgba(28,26,24,0.6);">
              Required to create an account.
            </p>
          </div>
        </label>

        {/* Honeypot — visually hidden, only bots fill this in */}
        <div
          aria-hidden="true"
          style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;"
          tabIndex={-1}
        >
          <label for="hp_website">Website</label>
          <input
            type="text"
            id="hp_website"
            name="hp_website"
            tabIndex={-1}
            autocomplete="off"
            value={honeypot.value}
            onInput={(e) =>
              honeypot.value = (e.target as HTMLInputElement).value}
          />
        </div>

        {/* Turnstile */}
        {turnstileSiteKey && (
          <div>
            {turnstileError.value && (
              <p
                class="text-sm rounded-lg px-3 py-2 mb-2"
                style="background-color: #fef2f2; color: #991b1b;"
              >
                {turnstileError.value}
              </p>
            )}
            <TurnstileWidget
              siteKey={turnstileSiteKey}
              onVerify={(token) => {
                turnstileToken.value = token;
                turnstileError.value = "";
              }}
              onError={(err) => {
                turnstileToken.value = "";
                turnstileError.value = err;
              }}
              onExpire={() => {
                turnstileToken.value = "";
                errorMessage.value = "Captcha expired — please verify again.";
                status.value = "error";
              }}
            />
          </div>
        )}

        {/* Error */}
        {status.value === "error" && (
          <p
            class="text-sm rounded-lg px-3 py-2"
            style="background-color: #fef2f2; color: #991b1b;"
          >
            {errorMessage.value}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          class="w-full py-3 px-6 text-white font-semibold bg-primary rounded-xl transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "Joining\u2026" : "Join Future Together"}
        </button>

        <p class="text-xs text-center" style="color: rgba(28,26,24,0.45);">
          No spam. Unsubscribe any time.
        </p>
      </form>
    </div>
  );
}
