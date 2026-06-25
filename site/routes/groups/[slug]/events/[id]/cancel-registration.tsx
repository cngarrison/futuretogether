/**
 * /groups/[slug]/events/[id]/cancel-registration?token=...
 *
 * CANONICAL cancel-registration page for group events.
 * Serves the cancellation link embedded in group event confirmation emails.
 * Shows event title and group name because both are resolvable from the URL params.
 *
 * For the equivalent page in the old meetup flow (where slug is not in scope at
 * URL-generation time) see: site/routes/meetups/cancel-registration.tsx
 *
 * GET  — validates the token, shows confirmation card or error/already-done state.
 * (No POST handler — the confirm button calls the API route via fetch.)
 *
 * States:
 *   - valid token, not yet cancelled → "Cancel your registration?" card + island button
 *   - already cancelled             → "Already cancelled" card
 *   - expired / invalid token       → "Link expired" card
 */
import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { createAdminClient } from "@/utils/supabase.ts";
import { verifyCancelRegistrationToken } from "@/utils/db/group-registrations.ts";
import GroupCancelRegistrationButton from "@/islands/GroupCancelRegistrationButton.tsx";

type State = "confirm" | "already_cancelled" | "invalid";

interface PageData {
  state: State;
  eventTitle: string;
  groupName: string;
  nameFirst: string;
  token: string;
  apiUrl: string; // POST target for the island button
  groupsUrl: string;
}

export const handler = define.handlers({
  async GET(ctx) {
    const { slug, id: eventId } = ctx.params;
    const token = new URL(ctx.req.url).searchParams.get("token") ?? "";

    const invalid = (): ReturnType<typeof page<PageData>> =>
      page<PageData>({
        state: "invalid",
        eventTitle: "",
        groupName: "",
        nameFirst: "",
        token: "",
        apiUrl: "",
        groupsUrl: "/groups",
      });

    if (!token) return invalid();

    const verified = await verifyCancelRegistrationToken(token);
    if (!verified || verified.eventId !== eventId) return invalid();

    // Admin client is REQUIRED here — not merely convenient.
    // This page is loaded via the cancellation link in a confirmation email;
    // the visitor is unauthenticated (token is the only proof of identity).
    // There is no auth.uid() in the request context, so the session client
    // cannot satisfy RLS. Service role is needed for:
    //   - event_registrations: SELECT status/name_first to render the page state
    //   - group_events: SELECT title + group name to display in the confirmation card
    const adminClient = createAdminClient();

    const { data: reg } = await adminClient
      .from("event_registrations")
      .select("status, name_first")
      .eq("id", verified.registrationId)
      .maybeSingle();

    if (!reg) return invalid();

    const { data: ev } = await adminClient
      .from("group_events")
      .select("title, group:groups!group_id(name, slug)")
      .eq("id", eventId)
      .maybeSingle();

    const evData = (ev ?? {}) as Record<string, unknown>;
    const group = (evData.group ?? {}) as Record<string, unknown>;
    const regData = reg as Record<string, unknown>;

    return page<PageData>({
      state: regData.status === "cancelled" ? "already_cancelled" : "confirm",
      eventTitle: (evData.title as string) ?? "this event",
      groupName: (group.name as string) ?? "",
      nameFirst: (regData.name_first as string) ?? "there",
      token,
      apiUrl: `/api/groups/${slug}/events/${eventId}/cancel-registration`,
      groupsUrl: `/groups/${slug}/`,
    });
  },
});

export default define.page<typeof handler>(function CancelRegistrationPage(
  { data },
) {
  const { state, eventTitle, groupName, nameFirst, token, apiUrl, groupsUrl } =
    data as PageData;

  return (
    <>
      <Head>
        <title>Cancel registration — Future Together</title>
      </Head>
      <div
        class="min-h-screen flex items-center justify-center p-6"
        style="background:#f7f4ef;"
      >
        <div
          class="bg-white rounded-2xl p-10 max-w-md w-full text-center"
          style="box-shadow:0 2px 16px rgba(0,0,0,.08);"
        >
          {/* Logo */}
          <p
            class="text-lg text-primary font-bold mb-8"
          >
            Future Together
          </p>

          {state === "invalid" && (
            <>
              <h1 class="text-xl font-bold text-near-black mb-3">
                Link expired
              </h1>
              <p class="text-sm mb-6" style="color:rgba(28,26,24,.6);">
                This cancellation link has expired or is invalid. If you still
                need to cancel, please contact us.
              </p>
              <a
                href="/groups"
                class="text-sm text-primary font-semibold"
              >
                Return to Future Together &rarr;
              </a>
            </>
          )}

          {state === "already_cancelled" && (
            <>
              <h1 class="text-xl font-bold text-near-black mb-3">
                Already cancelled
              </h1>
              <p class="text-sm mb-6" style="color:rgba(28,26,24,.6);">
                Your registration for <strong>{eventTitle}</strong>{" "}
                has already been cancelled.
              </p>
              <a
                href={groupsUrl}
                class="text-sm text-primary font-semibold"
              >
                View group &rarr;
              </a>
            </>
          )}

          {state === "confirm" && (
            <>
              <h1 class="text-xl font-bold text-near-black mb-3">
                Cancel your registration?
              </h1>
              <p class="text-sm mb-8" style="color:rgba(28,26,24,.6);">
                Hi {nameFirst} — you’re asking to cancel your registration for
                {" "}
                <strong>{eventTitle}</strong>
                {groupName
                  ? (
                    <>
                      {" "}organised by <strong>{groupName}</strong>
                    </>
                  )
                  : null}.
              </p>
              <GroupCancelRegistrationButton
                token={token}
                apiUrl={apiUrl}
                groupsUrl={groupsUrl}
                eventTitle={eventTitle}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
});
