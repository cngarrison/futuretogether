/**
 * MemberSignupForm island — membership registration form for the /join page.
 *
 * Submits to POST /api/members/register.
 * Fields: name, email, location (optional), how-heard (select),
 *         interests (multi-select checkboxes), wants-to-organise (checkbox).
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
  { value: "Friend or colleague", label: "Friend or colleague" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Meetup.com", label: "Meetup.com" },
  { value: "Blog post or article", label: "Blog post or article" },
  { value: "Search engine", label: "Search engine" },
  { value: "Other", label: "Other" },
];

type Status = "idle" | "submitting" | "success" | "already_member" | "error";

interface Props {
  turnstileSiteKey?: string;
}

export default function MemberSignupForm({ turnstileSiteKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstName = useSignal("");
  const lastName = useSignal("");
  const email = useSignal("");
  const location = useSignal("");
  const heardFrom = useSignal("");
  const selectedInterests = useSignal<string[]>([]);
  const wantsToOrganise = useSignal(false);
  const joinSlack = useSignal(true);
  const status = useSignal<Status>("idle");
  const errorMessage = useSignal("");
  const turnstileToken = useSignal("");
  const turnstileError = useSignal("");

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
          joinSlack: joinSlack.value,
          turnstile_token: turnstileToken.value || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        status.value = data.created ? "success" : "already_member";
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

  // -------------------------------------------------------------------------
  // Success state
  // -------------------------------------------------------------------------
  if (status.value === "success") {
    return (
      <div ref={containerRef}>
        <div class="text-center py-6">
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl"
            style="background-color: #1a5f6e;"
          >
            ✓
          </div>
          <h3 class="text-xl font-bold mb-2" style="color: #1c1a18;">
            Welcome to Future Together
          </h3>
          <p class="text-sm leading-relaxed" style="color: rgba(28,26,24,0.7);">
            You're in. Check your inbox for a welcome email — it includes a link to join our Slack workspace.
            {wantsToOrganise.value &&
              " We'll also be in touch about running a local group."}
          </p>
          {joinSlack.value && (
            <p class="text-sm mt-3" style="color: rgba(28,26,24,0.65);">
              Or{" "}
              <a
                href="https://join.slack.com/t/future-together-group/shared_invite/zt-3ssaug5th-1JI5b86jGesX8B77RojgBQ"
                target="_blank"
                rel="noopener noreferrer"
                style="color: #1a5f6e; font-weight: 600; text-decoration: underline; margin-left: 4px;"
              >
                join Slack right now &rarr;
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status.value === "already_member") {
    return (
      <div ref={containerRef}>
        <div class="text-center py-6">
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl"
            style="background-color: #c4853a;"
          >
            ✓
          </div>
          <h3 class="text-xl font-bold mb-2" style="color: #1c1a18;">
            You're already a member
          </h3>
          <p class="text-sm leading-relaxed" style="color: rgba(28,26,24,0.7);">
            Your details have been updated. Good to have you here.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------
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
                (optional)
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
                (optional)
              </span>
            </label>
            <div class="relative">
              <select
                value={heardFrom.value}
                onChange={(e) =>
                  heardFrom.value = (e.target as HTMLSelectElement).value}
                class="w-full px-3 py-2 pr-8 rounded-lg text-sm border appearance-none bg-white"
                style="border-color: #d0e4e7; outline: none;"
                disabled={isSubmitting}
              >
                {HEARD_FROM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <svg
                class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 4l4 4 4-4"
                  stroke="#1a5f6e"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
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
              (optional)
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

        {/* Organiser checkbox */}
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
            <span class="text-sm font-semibold" style="color: #1c1a18;">
              I want to run a local group in my area
            </span>
            <p class="text-xs mt-0.5" style="color: rgba(28,26,24,0.6);">
              We'll follow up with resources and support to help you get
              started.
            </p>
          </div>
        </label>

        {/* Join Slack */}
        <label
          class="flex items-start gap-3 cursor-pointer rounded-xl p-4"
          style={joinSlack.value
            ? "background-color: #f0f9fa; border: 1.5px solid #1a5f6e;"
            : "background-color: #f7f4ef; border: 1.5px solid transparent;"}
        >
          <input
            type="checkbox"
            checked={joinSlack.value}
            onChange={(e) =>
              joinSlack.value = (e.target as HTMLInputElement).checked}
            disabled={isSubmitting}
            class="mt-0.5 rounded flex-shrink-0"
            style="accent-color: #1a5f6e;"
          />
          <div>
            <span class="text-sm font-semibold" style="color: #1c1a18;">
              Email me the link to join our Slack
            </span>
            <p class="text-xs mt-0.5" style="color: rgba(28,26,24,0.6);">
              Our Slack workspace is where the conversation continues between meetups.
            </p>
          </div>
        </label>

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
          class="w-full py-3 px-6 text-white font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-60"
          style="background-color: #1a5f6e;"
        >
          {isSubmitting ? "Joining…" : "Join Future Together"}
        </button>

        <p class="text-xs text-center" style="color: rgba(28,26,24,0.45);">
          No spam. Unsubscribe any time.
        </p>
      </form>
    </div>
  );
}
