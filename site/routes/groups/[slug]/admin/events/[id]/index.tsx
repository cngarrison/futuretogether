import { page } from "fresh";
import { define } from "@/utils.ts";
import type { State } from "@/utils.ts";
import {
  getGroupEventById,
  updateGroupEvent,
} from "@/utils/db/group-events.ts";
import type {
  EventResource,
  UpdateGroupEventInput,
} from "@/utils/db/group-events.ts";
import { getGroupEventRegistrants } from "@/utils/db/group-registrations.ts";
import {
  getGroupEventsForProgram,
  getGroupEventWithProgramDefaults,
  getGroupProgramById,
  getLinkedEventForProgram,
  updateGroupProgram,
} from "@/utils/db/group-programs.ts";
import type { UpdateGroupProgramInput } from "@/utils/db/group-programs.ts";
import { getGroupMembers } from "@/utils/db/group-members.ts";
import type { GroupMember } from "@/utils/db/group-members.ts";
import EventInstancePage from "./(_components)/EventInstancePage.tsx";
import ProgramDetailPage from "./(_components)/ProgramDetailPage.tsx";
import OneOffEventPage from "./(_components)/OneOffEventPage.tsx";
import type { Flash, PageData, PageMode } from "./(_components)/shared.tsx";

// Re-export types consumed by co-located _*.tsx page files
export type { Flash, PageData, PageMode };

// event_date is now stored as naive local wall-clock time (ft-07i.15).
// No UTC conversion — the datetime-local form value is stored directly.

async function getAdminMembers(
  groupId: string,
  state: State,
): Promise<GroupMember[]> {
  const all = await getGroupMembers(groupId, state);
  return all.filter((m: GroupMember) =>
    ["group_owner", "group_admin"].includes(m.role)
  );
}

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const group = ctx.state.group!;
    const id = ctx.params.id;
    const url = new URL(ctx.req.url);

    const flash: Flash = url.searchParams.get("saved")
      ? { type: "saved" }
      : url.searchParams.get("published")
      ? { type: "published" }
      : url.searchParams.get("cancelled")
      ? { type: "cancelled" }
      : url.searchParams.get("generated")
      ? { type: "generated" }
      : url.searchParams.get("error")
      ? { type: "error", message: url.searchParams.get("error")! }
      : null;

    const members = await getAdminMembers(group.id, ctx.state);
    const base = {
      groupName: group.name,
      groupSlug: group.slug,
      members,
      currentUserId: ctx.state.user!.id,
      flash,
    };

    // Try as a group_event
    const event = await getGroupEventById(id, ctx.state);
    if (event) {
      if (event.group_id !== group.id) {
        return new Response("Not found", { status: 404 });
      }
      // If this event belongs to a one-off program, redirect to the program editor
      if (event.program_id) {
        const prog = await getGroupProgramById(event.program_id, ctx.state);
        if (prog?.program_type === "one-off") {
          // Preserve flash/error query params through the redirect (ft-07i.xx).
          return new Response(null, {
            status: 302,
            headers: {
              Location:
                `/groups/${group.slug}/admin/events/${prog.id}/${url.search}`,
            },
          });
        }
      }
      const registrants = event.status !== "draft"
        ? await getGroupEventRegistrants(event.id, ctx.state)
        : [];
      const eventWithDefaults = event.program_id
        ? await getGroupEventWithProgramDefaults(id, ctx.state)
        : null;
      return page({
        ...base,
        mode: "event",
        event,
        eventWithDefaults,
        registrants,
      });
    }

    // Try as a group_program
    const program = await getGroupProgramById(id, ctx.state);
    if (program) {
      if (program.group_id !== group.id) {
        return new Response("Not found", { status: 404 });
      }
      // One-off program: render combined editor (program fields + linked event fields)
      if (program.program_type === "one-off") {
        const linkedEventId = await getLinkedEventForProgram(id, ctx.state);
        const linkedEvent = linkedEventId
          ? await getGroupEventById(linkedEventId, ctx.state)
          : null;
        if (linkedEvent) {
          const registrants = linkedEvent.status !== "draft"
            ? await getGroupEventRegistrants(linkedEvent.id, ctx.state)
            : [];
          return page({
            ...base,
            mode: "one-off",
            program,
            event: linkedEvent,
            registrants,
          });
        }
      }
      // Recurring program (or one-off with no linked event yet)
      const instances = await getGroupEventsForProgram(id, ctx.state);
      return page({ ...base, mode: "program", program, instances });
    }

    return new Response("Not found", { status: 404 });
  },

  async POST(ctx) {
    const group = ctx.state.group!;
    const slug = group.slug;
    const id = ctx.params.id;
    const formData = await ctx.req.formData();
    const base = `/groups/${slug}/admin/events/${id}`;

    // Parse resources JSON (shared by all branches)
    let resources: EventResource[] = [];
    try {
      const raw = formData.get("resources") as string;
      if (raw) resources = JSON.parse(raw) as EventResource[];
    } catch { /* ignore */ }

    // ── Event branch (recurring instance OR legacy standalone) ───────────────────────
    const existingEvent = await getGroupEventById(id, ctx.state);
    if (existingEvent) {
      if (existingEvent.group_id !== group.id) {
        return new Response("Not found", { status: 404 });
      }

      let input: UpdateGroupEventInput;
      if (existingEvent.program_id) {
        // Instance override: empty string → null (clears override, inherits from program)
        input = {
          organiser_id: (formData.get("organiser_id") as string) || null,
          event_date: ((formData.get("event_date") as string) ?? "").trim() ||
            undefined,
          timezone: (formData.get("timezone") as string) || undefined,
          location_type: (formData.get("location_type") as string) || null,
          location_name:
            ((formData.get("location_name") as string) ?? "").trim() || null,
          location_address:
            ((formData.get("location_address") as string) ?? "").trim() || null,
          meeting_link:
            ((formData.get("meeting_link") as string) ?? "").trim() || null,
          duration_minutes: formData.get("duration_minutes")
            ? parseInt(formData.get("duration_minutes") as string, 10) || null
            : null,
          visibility: (formData.get("visibility") as string) || undefined,
          capacity: formData.get("capacity")
            ? parseInt(formData.get("capacity") as string, 10) || null
            : null,
          is_registration_required:
            formData.get("is_registration_required") === "on",
          resources,
        };
      } else {
        input = {
          title: ((formData.get("title") as string) ?? "").trim() || undefined,
          description: ((formData.get("description") as string) ?? "").trim() ||
            undefined,
          organiser_id: (formData.get("organiser_id") as string) || null,
          event_date: ((formData.get("event_date") as string) ?? "").trim() ||
            undefined,
          timezone: (formData.get("timezone") as string) || undefined,
          location_type: (formData.get("location_type") as string) || null,
          location_name:
            ((formData.get("location_name") as string) ?? "").trim() || null,
          location_address:
            ((formData.get("location_address") as string) ?? "").trim() || null,
          meeting_link:
            ((formData.get("meeting_link") as string) ?? "").trim() || null,
          duration_minutes: formData.get("duration_minutes")
            ? parseInt(formData.get("duration_minutes") as string, 10) || null
            : null,
          visibility: (formData.get("visibility") as string) || "private",
          capacity: formData.get("capacity")
            ? parseInt(formData.get("capacity") as string, 10) || null
            : null,
          is_registration_required:
            formData.get("is_registration_required") === "on",
          slideshow_url:
            ((formData.get("slideshow_url") as string) ?? "").trim() || null,
          resources,
        };
      }

      const { error } = await updateGroupEvent(id, input, ctx.state);
      if (error) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${base}/?error=${encodeURIComponent(error)}` },
        });
      }
      return new Response(null, {
        status: 302,
        headers: { Location: `${base}/?saved=1` },
      });
    }

    // ── Program branch (one-off + recurring) ────────────────────────────────────────
    const existingProgram = await getGroupProgramById(id, ctx.state);
    if (existingProgram) {
      if (existingProgram.group_id !== group.id) {
        return new Response("Not found", { status: 404 });
      }

      // One-off: update both program fields (title/description) and linked event fields
      if (existingProgram.program_type === "one-off") {
        const progInput: UpdateGroupProgramInput = {
          title: ((formData.get("title") as string) ?? "").trim() || undefined,
          description: ((formData.get("description") as string) ?? "").trim() ||
            undefined,
          organiser_id: (formData.get("organiser_id") as string) || null,
          visibility: (formData.get("visibility") as string) || "private",
          slideshow_url:
            ((formData.get("slideshow_url") as string) ?? "").trim() || null,
          resources,
        };
        const { error: progError } = await updateGroupProgram(
          id,
          progInput,
          ctx.state,
        );
        if (progError) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${base}/?error=${encodeURIComponent(progError)}`,
            },
          });
        }
        const linkedEventId = await getLinkedEventForProgram(id, ctx.state);
        if (linkedEventId) {
          const evInput: UpdateGroupEventInput = {
            title: ((formData.get("title") as string) ?? "").trim() ||
              undefined,
            event_date: ((formData.get("event_date") as string) ?? "").trim() ||
              undefined,
            timezone: (formData.get("timezone") as string) || undefined,
            location_type: (formData.get("location_type") as string) || null,
            location_name:
              ((formData.get("location_name") as string) ?? "").trim() || null,
            location_address:
              ((formData.get("location_address") as string) ?? "").trim() ||
              null,
            meeting_link:
              ((formData.get("meeting_link") as string) ?? "").trim() || null,
            duration_minutes: formData.get("duration_minutes")
              ? parseInt(formData.get("duration_minutes") as string, 10) || null
              : null,
            capacity: formData.get("capacity")
              ? parseInt(formData.get("capacity") as string, 10) || null
              : null,
            is_registration_required:
              formData.get("is_registration_required") === "on",
            organiser_id: (formData.get("organiser_id") as string) || null,
            visibility: (formData.get("visibility") as string) || "private",
            slideshow_url:
              ((formData.get("slideshow_url") as string) ?? "").trim() || null,
            resources,
          };
          const { error: evError } = await updateGroupEvent(
            linkedEventId,
            evInput,
            ctx.state,
          );
          if (evError) {
            return new Response(null, {
              status: 302,
              headers: {
                Location: `${base}/?error=${encodeURIComponent(evError)}`,
              },
            });
          }
        }
        return new Response(null, {
          status: 302,
          headers: { Location: `${base}/?saved=1` },
        });
      }

      // Recurring program
      const input: UpdateGroupProgramInput = {
        title: ((formData.get("title") as string) ?? "").trim() || undefined,
        description: ((formData.get("description") as string) ?? "").trim() ||
          undefined,
        organiser_id: (formData.get("organiser_id") as string) || null,
        recurrence_rule:
          ((formData.get("recurrence_rule") as string) ?? "").trim() ||
          undefined,
        seed_datetime:
          ((formData.get("seed_datetime") as string) ?? "").trim() || undefined,
        seed_timezone: (formData.get("timezone") as string) || undefined,
        slug_suffix: ((formData.get("slug_suffix") as string) ?? "").trim() ||
          null,
        duration_minutes: formData.get("duration_minutes")
          ? parseInt(formData.get("duration_minutes") as string, 10) || null
          : null,
        location_type: (formData.get("location_type") as string) || null,
        location_name:
          ((formData.get("location_name") as string) ?? "").trim() || null,
        location_address:
          ((formData.get("location_address") as string) ?? "").trim() || null,
        meeting_link: ((formData.get("meeting_link") as string) ?? "").trim() ||
          null,
        capacity: formData.get("capacity")
          ? parseInt(formData.get("capacity") as string, 10) || null
          : null,
        visibility: (formData.get("visibility") as string) || "private",
        slideshow_url:
          ((formData.get("slideshow_url") as string) ?? "").trim() || null,
        resources,
      };

      const { error } = await updateGroupProgram(id, input, ctx.state);
      if (error) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${base}/?error=${encodeURIComponent(error)}` },
        });
      }
      return new Response(null, {
        status: 302,
        headers: { Location: `${base}/?saved=1` },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

// ── Root dispatcher ──────────────────────────────────────────────────────────────────────

export default define.page<typeof handler>(function EventOrProgramPage(
  { data },
) {
  if (data.mode === "program") return <ProgramDetailPage data={data} />;
  if (data.mode === "one-off") return <OneOffEventPage data={data} />;
  return <EventInstancePage data={data} />;
});
