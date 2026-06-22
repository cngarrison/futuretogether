import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { createGroupApplication } from "@/utils/db/groups.ts";
import type { GroupApplication } from "@/utils/db/groups.ts";
import { sendGroupApplicationConfirmation } from "@/utils/email/groupEmail.ts";

interface PageData {
  loggedIn: boolean;
  submitted: boolean;
  error: string | null;
  fields: Partial<GroupApplication> & {
    location_name?: string;
    applicant_email: string;
    applicant_name: string;
  };
  userEmail: string | null;
  userName: string | null;
}

export const handler = define.handlers<PageData>({
  GET(ctx) {
    if (!ctx.state.user) {
      return page({
        loggedIn: false,
        submitted: false,
        error: null,
        fields: { applicant_email: "", applicant_name: "" },
        userEmail: null,
        userName: null,
      });
    }
    const user = ctx.state.user;

    const profile = ctx.state.profile;
    const nameFirst = profile?.name_first ?? null;
    const nameLast = profile?.name_last ?? null;
    const userName = nameFirst ? `${nameFirst} ${nameLast ?? ""}`.trim() : null;

    const url = new URL(ctx.req.url);
    const submitted = url.searchParams.get("submitted") === "1";
    return page({
      loggedIn: true,
      submitted,
      error: null,
      fields: {
        applicant_email: user.email ?? "",
        applicant_name: userName ?? "",
      },
      userEmail: user.email ?? null,
      userName,
    });
  },

  async POST(ctx) {
    if (!ctx.state.user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login?next=/groups/start" },
      });
    }
    const user = ctx.state.user;

    const profile = ctx.state.profile;
    const nameFirst = profile?.name_first ?? null;
    const nameLast = profile?.name_last ?? null;
    const userName = nameFirst ? `${nameFirst} ${nameLast ?? ""}`.trim() : null;
    const userEmail = user.email ?? null;

    const form = await ctx.req.formData();

    const tagsRaw = (form.get("tags") as string | null) ?? "";
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const fields: Partial<GroupApplication> & {
      location_name?: string;
      applicant_email: string;
      applicant_name: string;
    } = {
      name: (form.get("name") as string | null) ?? "",
      applicant_email: user.email ?? "",
      applicant_name: userName ?? "",
      group_type: ((form.get("group_type") as string | null) ?? "geographic") as
        | "geographic"
        | "non-geographic",
      location_name: (form.get("location_name") as string | null) ?? "",
      location_suburb: (form.get("location_suburb") as string | null) ?? "",
      location_region: (form.get("location_region") as string | null) ?? "",
      website_url: (form.get("website_url") as string | null) ?? "",
      tags,
      tier_suggestion: (form.get("tier_suggestion") as string | null) ?? "",
      tagline: (form.get("tagline") as string | null) ?? "",
      description: (form.get("description") as string | null) ?? "",
      why_start: (form.get("why_start") as string | null) ?? "",
      how_grow: (form.get("how_grow") as string | null) ?? "",
      coc_agreed: form.get("coc_agreed") === "on",
    };

    // Validate required fields
    const missing: string[] = [];
    if (!fields.name) missing.push("group name");
    if (!fields.tagline) missing.push("group tagline");
    if (!fields.description) missing.push("group description");
    if (!fields.why_start) missing.push("why you want to start this group");
    if (!fields.how_grow) missing.push("how you plan to grow it");
    if (!fields.coc_agreed) missing.push("agreement to the Code of Conduct");
    if (fields.group_type === "geographic" && !fields.location_name) {
      missing.push("location (required for geographic groups)");
    }

    if (missing.length > 0) {
      return page({
        loggedIn: true,
        submitted: false,
        error: `Please fill in: ${missing.join(", ")}.`,
        fields,
        userEmail,
        userName,
      });
    }

    const { error } = await createGroupApplication({
      ...(fields as GroupApplication),
      applicant_id: user.id,
    });

    if (error) {
      return page({
        loggedIn: true,
        submitted: false,
        error,
        fields,
        userEmail,
        userName,
      });
    }

    // Send confirmation email to applicant (non-fatal)
    try {
      await sendGroupApplicationConfirmation(
        fields.applicant_email,
        fields.applicant_name,
        fields.name ?? "",
      );
    } catch { /* non-fatal — application already saved */ }

    // Success — redirect to same page with ?submitted=1
    return new Response(null, {
      status: 302,
      headers: { Location: "/groups/start?submitted=1" },
    });
  },
});

export default define.page<typeof handler>(function GroupsStart({ data }) {
  const { loggedIn, submitted, error, fields } = data as PageData;

  return (
    <>
      <Head>
        <title>Apply to Start a Group — Future Together</title>
        <meta
          name="description"
          content="Apply to list your Future Together group. We'll review your application and get back to you within a few days."
        />
        <meta
          property="og:title"
          content="Apply to Start a Group — Future Together"
        />
        <meta
          property="og:description"
          content="Apply to list your Future Together group."
        />
        <meta property="og:image" content="/img/og-groups.webp" />
      </Head>

      {/* Hero */}
      <section
        class="text-white bg-primary"
        style="background-image: linear-gradient(rgba(26,95,110,0.80), rgba(26,95,110,0.80)), url('/img/local-group-hero.webp'); background-size: cover; background-position: center;"
      >
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p
            class="text-sm font-semibold uppercase tracking-widest mb-4"
            style="color: rgba(255,255,255,0.6);"
          >
            Take action
          </p>
          <h1 class="text-4xl sm:text-5xl font-bold mb-5">
            Apply to start a group
          </h1>
          <p
            class="text-lg leading-relaxed"
            style="color: rgba(255,255,255,0.8);"
          >
            Fill in the form below and we'll review your application. We aim to
            respond within a few days. Not sure if you're ready?{" "}
            <a href="/start-a-group" class="underline">
              Read our guide first
            </a>.
          </p>
        </div>
      </section>

      {/* Body */}
      <section class="py-16 bg-warm-white">
        <div class="max-w-2xl mx-auto px-4 sm:px-6">
          {!loggedIn
            ? (
              /* Unauthenticated — pitch the value, offer Login + Join */
              <div class="space-y-10">
                {/* Value pitch */}
                <div class="text-center">
                  <h2 class="text-2xl font-bold text-near-black mb-4">
                    You'll need an account to apply
                  </h2>
                  <p
                    class="text-lg leading-relaxed"
                    style="color: rgba(28,26,24,0.7);"
                  >
                    Starting a group is one of the most impactful things you can
                    do. A free Future Together account lets you manage your
                    group listing, connect with members, and be part of
                    something bigger.
                  </p>
                </div>

                {/* Benefits */}
                <ul class="space-y-4">
                  {[
                    [
                      "📍",
                      "List your group",
                      "Get your group in front of people in your area who are already looking for connection.",
                    ],
                    [
                      "🤝",
                      "Build your community",
                      "Manage members, share resources, and run events — all in one place.",
                    ],
                    [
                      "🌏",
                      "Join a movement",
                      "Connect with group leaders across Australia and beyond. You won't be doing this alone.",
                    ],
                  ].map(([icon, title, body]) => (
                    <li
                      key={title}
                      class="flex gap-4 rounded-2xl px-5 py-4"
                      style="background: white; border: 1px solid #d0e4e7;"
                    >
                      <span class="text-2xl">{icon}</span>
                      <div>
                        <p class="font-semibold text-near-black">{title}</p>
                        <p
                          class="text-sm mt-0.5"
                          style="color: rgba(28,26,24,0.65);"
                        >
                          {body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* CTAs */}
                <div class="flex flex-col sm:flex-row gap-4">
                  <a
                    href="/join"
                    class="flex-1 text-center px-7 py-3.5 font-semibold rounded-xl bg-accent text-white transition-opacity hover:opacity-90"
                  >
                    Create a free account &rarr;
                  </a>
                  <a
                    href="/login?next=/groups/start"
                    class="flex-1 text-center px-7 py-3.5 font-semibold rounded-xl text-primary transition-colors hover:bg-teal-50"
                    style="border: 2px solid #1a5f6e;"
                  >
                    Log in
                  </a>
                </div>

                <p
                  class="text-center text-sm"
                  style="color: rgba(28,26,24,0.45);"
                >
                  Already running a group?{" "}
                  <a href="/groups" class="underline">Browse existing groups</a>
                  {" "}
                  to make sure there isn't one for your area already.
                </p>
              </div>
            )
            : submitted
            ? (
              /* Success panel */
              <div
                class="rounded-2xl p-8 text-center"
                style="background-color: #eef5f7; border: 1px solid #d0e4e7;"
              >
                <div class="text-3xl mb-4">✓</div>
                <h2 class="text-2xl font-bold text-near-black mb-3">
                  Application received
                </h2>
                <p
                  class="text-lg leading-relaxed mb-6"
                  style="color: rgba(28,26,24,0.75);"
                >
                  Thank you — we'll review your application and get back to you
                  within a few days.
                </p>
                <a
                  href="/groups/"
                  class="inline-block px-7 py-3 font-semibold rounded-xl bg-primary text-white transition-opacity hover:opacity-90"
                >
                  Browse all groups &rarr;
                </a>
              </div>
            )
            : (
              /* Application form — authenticated user */
              /* (this branch is inside the loggedIn ternary's submitted check) */
              /* Application form */
              <>
                {error && (
                  <div
                    class="mb-6 p-4 rounded-xl text-sm font-medium"
                    style="background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7;"
                  >
                    {error}
                  </div>
                )}

                <form method="POST" class="space-y-8">
                  {/* Submitting as — read-only identity confirmation */}
                  {(data as PageData).userName || (data as PageData).userEmail
                    ? (
                      <div
                        class="rounded-xl px-4 py-3 text-sm"
                        style="background:#eef5f7; border: 1px solid #d0e4e7;"
                      >
                        <span style="color: rgba(28,26,24,0.5);">
                          Submitting as
                        </span>{" "}
                        <strong class="text-near-black">
                          {(data as PageData).userName ??
                            (data as PageData).userEmail}
                        </strong>{" "}
                        {(data as PageData).userName &&
                          (data as PageData).userEmail && (
                          <span style="color: rgba(28,26,24,0.5);">
                            • {(data as PageData).userEmail}
                          </span>
                        )}
                      </div>
                    )
                    : null}

                  {/* --- Group info --- */}
                  <fieldset class="space-y-4">
                    <legend class="text-lg font-bold text-near-black mb-1">
                      About your group
                    </legend>

                    <div>
                      <label class="block text-sm font-medium text-near-black mb-1">
                        Group name <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={fields.name ?? ""}
                        class="w-full rounded-xl px-4 py-2.5 text-sm"
                        style="border: 1px solid #d0e4e7; background: white;"
                        placeholder="Future Together Tumbarumba"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-near-black mb-1">
                        Tagline <span class="text-red-500">*</span>
                      </label>
                      <p
                        class="text-xs mb-1"
                        style="color: rgba(28,26,24,0.5);"
                      >
                        A short phrase that captures what your group is about
                        (max 120 characters)
                      </p>
                      <input
                        type="text"
                        name="tagline"
                        required
                        maxLength={120}
                        value={fields.tagline ?? ""}
                        class="w-full rounded-xl px-4 py-2.5 text-sm"
                        style="border: 1px solid #d0e4e7; background: white;"
                        placeholder="Conversations about AI and our shared future in Tumbarumba"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-near-black mb-2">
                        Group type <span class="text-red-500">*</span>
                      </label>
                      <div class="space-y-2">
                        <label class="flex items-start gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="group_type"
                            value="geographic"
                            checked={(
                              fields.group_type ?? "geographic"
                            ) === "geographic"}
                            class="mt-0.5"
                          />
                          <span class="text-sm">
                            <strong>Geographic</strong>{" "}
                            — local or regional area (e.g. a city, town, or
                            region)
                          </span>
                        </label>
                        <label class="flex items-start gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="group_type"
                            value="non-geographic"
                            checked={fields.group_type === "non-geographic"}
                            class="mt-0.5"
                          />
                          <span class="text-sm">
                            <strong>Non-geographic</strong>{" "}
                            — interest or organisation-based (e.g. healthcare
                            workers, educators)
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Location fields — for geographic groups */}
                    {/* TODO Phase B: show/hide conditionally based on group_type radio (island) */}
                    <div>
                      <label class="block text-sm font-medium text-near-black mb-1">
                        Location{" "}
                        <span
                          class="font-normal"
                          style="color: rgba(28,26,24,0.5);"
                        >
                          (for geographic groups)
                        </span>
                      </label>
                      <p
                        class="text-xs mb-1"
                        style="color: rgba(28,26,24,0.5);"
                      >
                        Country or broadest area (e.g. Tumbarumba, NSW,
                        Australia)
                      </p>
                      <input
                        type="text"
                        name="location_name"
                        value={fields.location_name ?? ""}
                        class="w-full rounded-xl px-4 py-2.5 text-sm"
                        style="border: 1px solid #d0e4e7; background: white;"
                        placeholder="NSW, Australia"
                      />
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-near-black mb-1">
                          Suburb / Town{" "}
                          <span
                            class="font-normal"
                            style="color: rgba(28,26,24,0.5);"
                          >
                            (geographic)
                          </span>
                        </label>
                        <input
                          type="text"
                          name="location_suburb"
                          value={fields.location_suburb ?? ""}
                          class="w-full rounded-xl px-4 py-2.5 text-sm"
                          style="border: 1px solid #d0e4e7; background: white;"
                          placeholder="Tumbarumba"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-near-black mb-1">
                          Region / State area{" "}
                          <span
                            class="font-normal"
                            style="color: rgba(28,26,24,0.5);"
                          >
                            (geographic)
                          </span>
                        </label>
                        <input
                          type="text"
                          name="location_region"
                          value={fields.location_region ?? ""}
                          class="w-full rounded-xl px-4 py-2.5 text-sm"
                          style="border: 1px solid #d0e4e7; background: white;"
                          placeholder="Snowy Mountains, NSW"
                        />
                      </div>
                    </div>

                    {/* Website URL — especially for non-geographic groups */}
                    <div>
                      <label class="block text-sm font-medium text-near-black mb-1">
                        Website URL{" "}
                        <span
                          class="font-normal"
                          style="color: rgba(28,26,24,0.5);"
                        >
                          (optional)
                        </span>
                      </label>
                      <p
                        class="text-xs mb-1"
                        style="color: rgba(28,26,24,0.5);"
                      >
                        If your group already has a website or social page
                      </p>
                      <input
                        type="url"
                        name="website_url"
                        value={fields.website_url ?? ""}
                        class="w-full rounded-xl px-4 py-2.5 text-sm"
                        style="border: 1px solid #d0e4e7; background: white;"
                        placeholder="https://"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-near-black mb-1">
                        Tier suggestion
                      </label>
                      <select
                        name="tier_suggestion"
                        class="w-full rounded-xl px-4 py-2.5 text-sm"
                        style="border: 1px solid #d0e4e7; background: white;"
                      >
                        <option value="">Select a tier (optional)</option>
                        <option
                          value="local"
                          selected={fields.tier_suggestion === "local"}
                        >
                          Local
                        </option>
                        <option
                          value="regional"
                          selected={fields.tier_suggestion === "regional"}
                        >
                          Regional
                        </option>
                        <option
                          value="state"
                          selected={fields.tier_suggestion === "state"}
                        >
                          State / Province
                        </option>
                        <option
                          value="national"
                          selected={fields.tier_suggestion === "national"}
                        >
                          National
                        </option>
                        <option
                          value="thematic"
                          selected={fields.tier_suggestion === "thematic"}
                        >
                          Thematic / Interest-based
                        </option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-near-black mb-1">
                        Tags{" "}
                        <span
                          class="font-normal"
                          style="color: rgba(28,26,24,0.5);"
                        >
                          (optional)
                        </span>
                      </label>
                      <p
                        class="text-xs mb-1"
                        style="color: rgba(28,26,24,0.5);"
                      >
                        Comma-separated keywords describing your group's focus
                        (e.g. education, healthcare, rural)
                      </p>
                      <input
                        type="text"
                        name="tags"
                        value={(fields.tags ?? []).join(", ")}
                        class="w-full rounded-xl px-4 py-2.5 text-sm"
                        style="border: 1px solid #d0e4e7; background: white;"
                        placeholder="education, rural, local government"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-near-black mb-1">
                        Public description <span class="text-red-500">*</span>
                      </label>
                      <p
                        class="text-xs mb-1"
                        style="color: rgba(28,26,24,0.5);"
                      >
                        What is this group? Who is it for?
                      </p>
                      <textarea
                        name="description"
                        required
                        rows={4}
                        class="w-full rounded-xl px-4 py-2.5 text-sm"
                        style="border: 1px solid #d0e4e7; background: white; resize: vertical;"
                        placeholder="A group for people in Tumbarumba who want to understand AI and face the future together..."
                      >
                        {fields.description ?? ""}
                      </textarea>
                    </div>
                  </fieldset>

                  {/* --- Application questions --- */}
                  <fieldset class="space-y-4">
                    <legend class="text-lg font-bold text-near-black mb-1">
                      A little more
                    </legend>

                    <div>
                      <label class="block text-sm font-medium text-near-black mb-1">
                        Why do you want to start this group?{" "}
                        <span class="text-red-500">*</span>
                      </label>
                      <textarea
                        name="why_start"
                        required
                        rows={3}
                        class="w-full rounded-xl px-4 py-2.5 text-sm"
                        style="border: 1px solid #d0e4e7; background: white; resize: vertical;"
                      >
                        {fields.why_start ?? ""}
                      </textarea>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-near-black mb-1">
                        How do you plan to grow and run it?{" "}
                        <span class="text-red-500">*</span>
                      </label>
                      <textarea
                        name="how_grow"
                        required
                        rows={3}
                        class="w-full rounded-xl px-4 py-2.5 text-sm"
                        style="border: 1px solid #d0e4e7; background: white; resize: vertical;"
                      >
                        {fields.how_grow ?? ""}
                      </textarea>
                    </div>
                  </fieldset>

                  {/* --- CoC --- */}
                  <div>
                    <label class="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="coc_agreed"
                        required
                        class="mt-0.5"
                      />
                      <span class="text-sm" style="color: rgba(28,26,24,0.8);">
                        I agree to the{" "}
                        <a
                          href="/groups/code-of-conduct"
                          class="underline text-primary"
                        >
                          Future Together Code of Conduct
                        </a>{" "}
                        and commit to running my group in line with Future
                        Together values. <span class="text-red-500">*</span>
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    class="w-full px-8 py-3.5 font-semibold rounded-xl bg-accent text-white transition-opacity hover:opacity-90"
                  >
                    Submit application
                  </button>
                </form>
              </>
            )}
        </div>
      </section>
    </>
  );
});
