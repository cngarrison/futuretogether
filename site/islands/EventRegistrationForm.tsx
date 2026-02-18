import { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import TurnstileWidget from "./TurnstileWidget.tsx";

interface EventRegistrationFormProps {
  eventHeadingText?: string;
  eventHeadingClass?: string;
  eventSlug: string;
  eventTitle: string;
  turnstileSiteKey?: string;
}

export default function EventRegistrationForm({
  eventHeadingText,
  eventHeadingClass = "text-2xl font-bold text-gray-900 mb-4",
  eventSlug,
  eventTitle,
  turnstileSiteKey,
}: EventRegistrationFormProps): JSX.Element {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState("");
  const [heardFrom, setHeardFrom] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "full"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const [eventStatus, setEventStatus] = useState<
    {
      available: boolean;
      isFull: boolean;
      showLimitedSeats: boolean;
    } | null
  >(null);

  // Check event availability on mount
  useEffect(() => {
    fetch(`/api/events/${eventSlug}/status`)
      .then((res) => res.json())
      .then((data) => {
        setEventStatus(data);
        if (data.isFull) {
          setStatus("full");
        }
      })
      .catch(console.error);
  }, [eventSlug]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setStatus("error");
      setErrorMessage("Please fill in all required fields");
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address");
      return;
    }

    // Check Turnstile token if site key is configured
    if (turnstileSiteKey && !turnstileToken) {
      setStatus("error");
      setErrorMessage("Please complete the captcha verification");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(`/api/events/${eventSlug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          interests,
          heardFrom,
          turnstile_token: turnstileToken,
        }),
        //credentials: 'same-origin',
      });

      if (!response.ok) {
        const data = await response.json();

        if (data.code === "EVENT_FULL" || data.code === "NO_AVAILABLE_EVENT") {
          setStatus("full");
          setErrorMessage(data.error || "This event is currently full");
        } else {
          setStatus("error");
          setErrorMessage(
            data.error || "Registration failed. Please try again.",
          );
        }
        return;
      }

      setStatus("success");
      setFirstName("");
      setLastName("");
      setEmail("");
      setInterests("");
      setHeardFrom("");
    } catch (error) {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  if (status === "full") {
    return (
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div class="flex items-start">
          <svg
            class="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            >
            </path>
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-yellow-800 mb-2">
              Event Full
            </h3>
            <p class="text-yellow-700">
              This session has reached capacity. Please check back for the next
              scheduled event.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div class="bg-green-50 border border-green-200 rounded-lg p-6">
        <div class="flex items-start">
          <svg
            class="w-12 h-12 text-green-600 mr-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            >
            </path>
          </svg>
          <div>
            <h3 class="text-xl font-bold text-green-800 mb-2">
              Registration Confirmed!
            </h3>
            <p class="text-green-700 mb-4">
              Thank you for registering for{" "}
              {eventTitle}. Check your email for confirmation and calendar
              invite.
            </p>
            <p class="text-sm text-green-600">
              We'll send you a reminder 24 hours before the event.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {eventHeadingText && <h2 class={eventHeadingClass}>{eventHeadingText}
      </h2>}

      {eventStatus?.showLimitedSeats && (
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p class="text-orange-800 font-semibold flex items-center">
            <svg
              class="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              >
              </path>
            </svg>
            Limited seats remaining!
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              First Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onInput={(e) => {
                setFirstName(e.currentTarget.value);
                setStatus("idle");
              }}
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2"
              disabled={status === "loading"}
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onInput={(e) => {
                setLastName(e.currentTarget.value);
                setStatus("idle");
              }}
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2"
              disabled={status === "loading"}
              required
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Email <span class="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onInput={(e) => {
              setEmail(e.currentTarget.value);
              setStatus("idle");
            }}
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2"
            disabled={status === "loading"}
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            What aspects are you most interested in discussing?
          </label>
          <p class="text-xs text-gray-500 mb-2">
            Examples: job market changes, community resilience, food security,
            preparing for uncertainty
          </p>
          <textarea
            value={interests}
            onInput={(e) => setInterests(e.currentTarget.value)}
            rows={3}
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2"
            disabled={status === "loading"}
            placeholder="Tell us what you'd like to learn or discuss..."
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            How did you hear about this event?
          </label>
          <select
            value={heardFrom}
            onChange={(e) => setHeardFrom(e.currentTarget.value)}
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2"
            disabled={status === "loading"}
          >
            <option value="">Select an option</option>
            <option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option>
            <option value="x-twitter">X (Twitter)</option>
            <option value="friend">Friend or colleague</option>
            <option value="other">Other</option>
          </select>
        </div>

        {status === "error" && (
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Turnstile Captcha */}
        {turnstileSiteKey && (
          <>
            {turnstileError && (
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-600 text-sm">{turnstileError}</p>
              </div>
            )}
            <TurnstileWidget
              siteKey={turnstileSiteKey}
              onVerify={(token) => {
                setTurnstileToken(token);
                setTurnstileError("");
              }}
              onError={(error) => {
                setTurnstileToken("");
                setTurnstileError(error);
              }}
              onExpire={() => {
                setTurnstileToken("");
                setStatus("error");
                setErrorMessage("Captcha expired, please verify again");
              }}
            />
          </>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          style="background-color: #1a5f6e;"
          class={`w-full text-white font-bold py-3 px-6 rounded-lg transition-opacity duration-200 ${
            status === "loading" ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          {status === "loading"
            ? (
              <span class="flex items-center justify-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  >
                  </circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  >
                  </path>
                </svg>
                Processing...
              </span>
            )
            : (
              "Register Now"
            )}
        </button>
      </form>
    </div>
  );
}
