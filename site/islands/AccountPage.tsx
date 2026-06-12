import { useState } from "preact/hooks";

interface StatusMessage {
  type: "success" | "error";
  message: string;
}

interface AccountPageProps {
  nameFirst: string;
  nameLast: string;
  email: string;
  hasPassword: boolean;
}

/**
 * AccountPage island
 * Handles profile and password form submissions via fetch to /api/account/*.
 * Receives initial data server-side; all form state is managed client-side.
 */
export default function AccountPage(
  {
    nameFirst: initialNameFirst,
    nameLast: initialNameLast,
    email,
    hasPassword,
  }: AccountPageProps,
) {
  // --- Profile state ---
  const [nameFirst, setNameFirst] = useState(initialNameFirst);
  const [nameLast, setNameLast] = useState(initialNameLast);
  const [profileStatus, setProfileStatus] = useState<StatusMessage | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(false);

  // --- Password state ---
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<StatusMessage | null>(
    null,
  );
  const [passwordLoading, setPasswordLoading] = useState(false);

  // --------------------------------------------------------------------------
  // Profile handler
  // --------------------------------------------------------------------------
  async function handleProfileSave(e: Event) {
    e.preventDefault();
    if (!nameFirst.trim()) {
      setProfileStatus({
        type: "error",
        message: "First name cannot be empty.",
      });
      return;
    }
    setProfileLoading(true);
    setProfileStatus(null);
    try {
      const res = await fetch("/api/account/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameFirst: nameFirst.trim(),
          nameLast: nameLast.trim(),
        }),
      });
      const json = await res.json() as { success?: boolean; error?: string };
      if (json.success) {
        setProfileStatus({ type: "success", message: "Profile updated." });
      } else {
        setProfileStatus({
          type: "error",
          message: json.error ?? "Update failed.",
        });
      }
    } catch {
      setProfileStatus({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setProfileLoading(false);
    }
  }

  // --------------------------------------------------------------------------
  // Password handler
  // --------------------------------------------------------------------------
  async function handlePasswordSave(e: Event) {
    e.preventDefault();
    if (password.length < 8) {
      setPasswordStatus({
        type: "error",
        message: "Password must be at least 8 characters.",
      });
      return;
    }
    if (password !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "Passwords do not match." });
      return;
    }
    setPasswordLoading(true);
    setPasswordStatus(null);
    try {
      const res = await fetch("/api/account/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const json = await res.json() as { success?: boolean; error?: string };
      if (json.success) {
        setPasswordStatus({
          type: "success",
          message: hasPassword
            ? "Password updated."
            : "Password added to your account.",
        });
        setPassword("");
        setConfirmPassword("");
      } else {
        setPasswordStatus({
          type: "error",
          message: json.error ?? "Update failed.",
        });
      }
    } catch {
      setPasswordStatus({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div class="space-y-6">
      {/* Profile card */}
      <div class="bg-white rounded-2xl shadow-sm p-8">
        <h2 class="text-lg font-semibold text-primary mb-6">Profile</h2>
        <form onSubmit={handleProfileSave} class="space-y-5">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-1"
                for="nameFirst"
              >
                First name
              </label>
              <input
                id="nameFirst"
                type="text"
                autocomplete="given-name"
                value={nameFirst}
                onInput={(e) =>
                  setNameFirst((e.target as HTMLInputElement).value)}
                maxLength={100}
                required
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                placeholder="First name"
              />
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-1"
                for="nameLast"
              >
                Last name
              </label>
              <input
                id="nameLast"
                type="text"
                autocomplete="family-name"
                value={nameLast}
                onInput={(e) =>
                  setNameLast((e.target as HTMLInputElement).value)}
                maxLength={100}
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                placeholder="Last name"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              disabled
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-400">
              Email address cannot be changed here.
            </p>
          </div>
          {profileStatus && (
            <div
              class={`text-sm px-4 py-2.5 rounded-lg ${
                profileStatus.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {profileStatus.message}
            </div>
          )}
          <div class="pt-1">
            <button
              type="submit"
              disabled={profileLoading}
              class="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-accent disabled:opacity-60 transition-opacity"
            >
              {profileLoading ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Password card */}
      <div class="bg-white rounded-2xl shadow-sm p-8">
        <h2 class="text-lg font-semibold text-primary mb-2">
          {hasPassword
            ? "Change your password"
            : "Add a password to your account"}
        </h2>
        <p class="text-sm text-gray-500 mb-6">
          {hasPassword
            ? "Your current session confirms your identity — no existing password required."
            : "Add a password so you can sign in without a magic link."}
        </p>
        <form onSubmit={handlePasswordSave} class="space-y-5">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="password"
            >
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              minLength={8}
              required
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              placeholder="Minimum 8 characters"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="confirmPassword"
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onInput={(e) =>
                setConfirmPassword((e.target as HTMLInputElement).value)}
              required
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              placeholder="Re-enter your password"
            />
          </div>
          {passwordStatus && (
            <div
              class={`text-sm px-4 py-2.5 rounded-lg ${
                passwordStatus.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {passwordStatus.message}
            </div>
          )}
          <div class="pt-1">
            <button
              type="submit"
              disabled={passwordLoading}
              class="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-accent disabled:opacity-60 transition-opacity"
            >
              {passwordLoading
                ? "Saving…"
                : hasPassword
                ? "Change password"
                : "Add password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
