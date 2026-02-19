import { JSX } from "preact";
import { useState } from "preact/hooks";
import SelectField from "@/components/SelectField.tsx";
import TurnstileWidget from "./TurnstileWidget.tsx";

interface ContactFormProps {
  /** Source identifier passed to the API for tracking */
  source?: string;
  /** Optional Turnstile CAPTCHA site key */
  turnstileSiteKey?: string;
  /** Optional callback after successful submission */
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  email: string;
  topic: string;
  heard_from: string;
  message: string;
}

const TOPIC_OPTIONS = [
  { value: "", label: "What’s this about?" },
  { value: "general", label: "General question about Future Together" },
  { value: "local-group", label: "Starting or finding a local group" },
  { value: "media", label: "Media, podcast or speaking inquiry" },
  { value: "collaboration", label: "Collaboration or partnership" },
  { value: "feedback", label: "Feedback or suggestion" },
  { value: "other", label: "Something else" },
];

const HEARD_FROM_OPTIONS = [
  { value: "", label: "How did you find us?" },
  { value: "meetup", label: "Attended a meetup" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "word-of-mouth", label: "Friend or colleague" },
  { value: "blog", label: "Blog or article" },
  { value: "search", label: "Web search" },
  { value: "other", label: "Other" },
];

/** Shared class for text inputs and textarea */
const inputClass =
  "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a5f6e] focus:ring-2 focus:ring-[#1a5f6e]/20 bg-white transition-colors disabled:opacity-50";

export default function ContactForm({
  source = "contact",
  onSuccess,
  turnstileSiteKey,
}: ContactFormProps): JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    topic: "",
    heard_from: "",
    message: "",
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setStatus("error");
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!formData.message.trim()) {
      setStatus("error");
      setErrorMessage("Please add a message so we know how to help.");
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setStatus("error");
      setErrorMessage("Please complete the captcha verification.");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source,
          turnstile_token: turnstileToken,
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      setStatus("success");
      setFormData({ name: "", email: "", topic: "", heard_from: "", message: "" });
      onSuccess?.();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        (error as Error).message || "Failed to send message. Please try again.",
      );
    }
  };

  if (status === "success") {
    return (
      <div
        class="bg-white rounded-2xl p-8 text-center"
        style="border: 1px solid #d0e4e7;"
      >
        <svg
          class="w-14 h-14 mx-auto mb-4"
          style="color: #c4853a;"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="text-xl font-bold mb-2" style="color: #1a5f6e;">
          Message sent!
        </h3>
        <p class="text-gray-600 text-sm">
          Thanks for getting in touch. We’ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div
      class="bg-white rounded-2xl p-8"
      style="border: 1px solid #d0e4e7;"
    >
      <h3 class="text-xl font-bold mb-5" style="color: #1a5f6e;">
        Send us a message
      </h3>

      <form onSubmit={handleSubmit} class="space-y-4">
        {/* Name + Email */}
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.currentTarget.value)}
              placeholder="Your name"
              class={inputClass}
              disabled={status === "loading"}
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.currentTarget.value)}
              placeholder="you@example.com"
              class={inputClass}
              disabled={status === "loading"}
              required
            />
          </div>
        </div>

        {/* Topic + Heard from */}
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <SelectField
              value={formData.topic}
              options={TOPIC_OPTIONS}
              onChange={(v) => handleChange("topic", v)}
              disabled={status === "loading"}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              How did you find us?
            </label>
            <SelectField
              value={formData.heard_from}
              options={HEARD_FROM_OPTIONS}
              onChange={(v) => handleChange("heard_from", v)}
              disabled={status === "loading"}
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Message *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) =>
              handleChange("message", e.currentTarget.value)}
            placeholder="What's on your mind? A question, an idea, or just a hello — all welcome."
            rows={4}
            class={`${inputClass} resize-none`}
            disabled={status === "loading"}
            required
          />
        </div>

        {/* Error */}
        {status === "error" && (
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-red-600 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Turnstile */}
        {turnstileSiteKey && (
          <>
            {turnstileError && (
              <div class="bg-red-50 border border-red-200 rounded-lg p-3">
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
                setErrorMessage("Captcha expired — please verify again.");
              }}
            />
          </>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          class={`w-full text-white font-semibold py-3 px-6 rounded-xl transition-opacity ${
            status === "loading" ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
          }`}
          style="background-color: #1a5f6e;"
        >
          {status === "loading"
            ? (
              <span class="flex items-center justify-center gap-2">
                <svg
                  class="animate-spin h-4 w-4"
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
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending…
              </span>
            )
            : "Send message"}
        </button>
      </form>
    </div>
  );
}
