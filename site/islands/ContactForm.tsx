import { JSX } from "preact";
import { useState } from "preact/hooks";
import TurnstileWidget from "./TurnstileWidget.tsx";

interface ContactFormProps {
  /** Optional custom heading */
  heading?: string;
  /** Optional custom description */
  description?: string;
  /** Source identifier for tracking */
  source: string;
  /** Optional class name for container */
  class?: string;
  /** Optional callback after successful submission */
  onSuccess?: () => void;
  /** Turnstile site key from environment */
  turnstileSiteKey?: string;
}

interface FormData {
  name: string;
  email: string;
  company_size: string;
  problem_description: string;
  industry: string;
  current_tools: string;
  timeline: string;
}

const COMPANY_SIZE_OPTIONS = [
  { value: "", label: "Select company size..." },
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-1000", label: "201-1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];

const INDUSTRY_OPTIONS = [
  { value: "", label: "Select industry..." },
  { value: "technology", label: "Technology/Software" },
  { value: "finance", label: "Finance/Banking" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "consulting", label: "Consulting" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail/E-commerce" },
  { value: "media", label: "Media/Marketing" },
  { value: "government", label: "Government/Public Sector" },
  { value: "other", label: "Other" },
];

const TIMELINE_OPTIONS = [
  { value: "", label: "Select timeline..." },
  { value: "immediate", label: "Immediate (this week)" },
  { value: "1-month", label: "Within 1 month" },
  { value: "3-months", label: "Within 3 months" },
  { value: "6-months", label: "Within 6 months" },
  { value: "exploring", label: "Just exploring options" },
];

export default function ContactForm({
  heading = "Get Started with Future Together",
  description = "Tell us about your project and let's explore how Future Together can help accelerate your development process.",
  source,
  class: className = "",
  onSuccess,
  turnstileSiteKey,
}: ContactFormProps): JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company_size: "",
    problem_description: "",
    industry: "",
    current_tools: "",
    timeline: "",
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");

  const handleInputChange = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      setStatus("error");
      setErrorMessage("Please enter your name");
      return;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, source, turnstile_token: turnstileToken }),
		//credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setStatus("success");
      setFormData({
        name: "",
        email: "",
        company_size: "",
        problem_description: "",
        industry: "",
        current_tools: "",
        timeline: "",
      });
      onSuccess?.();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error.message || "Failed to submit form. Please try again."
      );
    }
  };

  return (
    <div class={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {status === "success" ? (
        <div class="text-center">
          <svg
            class="w-16 h-16 mx-auto mb-4" style="color: #c4853a;"
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
          <h3 class="text-xl font-bold mb-2" style="color: #c4853a;">
            Thank You!
          </h3>
          <p class="text-gray-600">
            We've received your information and will be in touch soon to discuss
            how Future Together can help with your project.
          </p>
        </div>
      ) : (
        <>
          <h3 class="text-xl font-bold mb-2" style="color: #1a5f6e;">
            {heading}
          </h3>
          <p class="text-gray-600 mb-6">
            {description}
          </p>

          <form onSubmit={handleSubmit} class="space-y-4">
            {/* Required Fields */}
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.currentTarget.value)}
                  placeholder="Your full name"
                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2"
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
                  onChange={(e) => handleInputChange("email", e.currentTarget.value)}
                  placeholder="your.email@company.com"
                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2"
                  disabled={status === "loading"}
                  required
                />
              </div>
            </div>

            {/* Optional Qualifying Fields */}
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <select
                  value={formData.company_size}
                  onChange={(e) => handleInputChange("company_size", e.currentTarget.value)}
                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2"
                  disabled={status === "loading"}
                >
                  {COMPANY_SIZE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleInputChange("industry", e.currentTarget.value)}
                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2"
                  disabled={status === "loading"}
                >
                  {INDUSTRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                What challenges could an AI project assistant help you solve?
              </label>
              <textarea
                value={formData.problem_description}
                onChange={(e) => handleInputChange("problem_description", e.currentTarget.value)}
                placeholder="e.g., Research and analysis, content creation, project planning, documentation, data organization, workflow optimization..."
                rows={3}
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2 resize-none"
                disabled={status === "loading"}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Current Project Tools
              </label>
              <input
                type="text"
                value={formData.current_tools}
                onChange={(e) => handleInputChange("current_tools", e.currentTarget.value)}
                placeholder="e.g., Notion, Slack, Figma, Google Workspace, Trello, Airtable..."
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2"
                disabled={status === "loading"}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Timeline for Implementation
              </label>
              <select
                value={formData.timeline}
                onChange={(e) => handleInputChange("timeline", e.currentTarget.value)}
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none focus:ring-2"
                disabled={status === "loading"}
              >
                {TIMELINE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {status === "error" && (
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-600 text-sm">{errorMessage}</p>
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
              class={`w-full text-white font-bold py-3 px-6 rounded-lg transition-opacity duration-200 
              ${status === "loading" ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              {status === "loading" ? (
                <span class="flex items-center justify-center">
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Submitting...
                </span>
              ) : (
                "Get Started"
              )}
            </button>
          </form>

          <p class="text-sm text-gray-500 mt-4 text-center">
            * Required fields. We'll use this information to better understand
            your needs and provide relevant recommendations.
          </p>
        </>
      )}
    </div>
  );
}