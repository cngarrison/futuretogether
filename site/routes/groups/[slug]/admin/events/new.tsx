import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import type { State } from "@/utils.ts";
import { createGroupEvent } from "@/utils/db/group-events.ts";
import type {
  CreateGroupEventInput,
  EventResource,
} from "@/utils/db/group-events.ts";
import {
  createGroupEventForProgram,
  createGroupProgram,
  getGroupPrograms,
} from "@/utils/db/group-programs.ts";
import type {
  CreateGroupProgramInput,
  GroupProgramDetail,
} from "@/utils/db/group-programs.ts";
import { getGroupMembers } from "@/utils/db/group-members.ts";
import type { GroupMember } from "@/utils/db/group-members.ts";
import GroupEventForm from "@/islands/GroupEventForm.tsx";

// event_date is now stored as naive local wall-clock time (ft-07i.15).
// No UTC conversion — the datetime-local form value is stored directly.

interface PageData {
  groupName: string;
  groupSlug: string;
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
  programs: GroupProgramDetail[];
  error?: string;
}

async function getAdminMembers(
  groupId: string,
  state: State,
): Promise<GroupMember[]> {
  const all = await getGroupMembers(groupId, state);
  return all.filter((m) => ["group_owner", "group_admin"].includes(m.role));
}

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const group = ctx.state.group!;
    const [members, programs] = await Promise.all([
      getAdminMembers(group.id, ctx.state),
      getGroupPrograms(group.id, ctx.state),
    ]);
    return page({
      groupName: group.name,
      groupSlug: group.slug,
      groupId: group.id,
      members,
      currentUserId: ctx.state.user!.id,
      programs: programs.filter((p) => p.program_type === "recurring"),
    });
  },

  async POST(ctx) {
    const group = ctx.state.group!;
    const slug = group.slug;
    const formData = await ctx.req.formData();

    const title = ((formData.get("title") as string) ?? "").trim();
    const eventType = (formData.get("event_type") as string) ?? "one-off";

    // Parse resources JSON (shared by both one-off and recurring)
    let resources: EventResource[] = [];
    try {
      const raw = formData.get("resources") as string;
      if (raw) resources = JSON.parse(raw) as EventResource[];
    } catch { /* ignore */ }

    // ── Instance of existing program branch ───────────────────────────
    if (eventType === "instance-of-program") {
      const programId = ((formData.get("program_id") as string) ?? "").trim();
      const eventDate = ((formData.get("event_date") as string) ?? "").trim();

      if (!programId || !eventDate) {
        const [members, programs] = await Promise.all([
          getAdminMembers(group.id, ctx.state),
          getGroupPrograms(group.id, ctx.state),
        ]);
        return page(
          {
            groupName: group.name,
            groupSlug: slug,
            groupId: group.id,
            members,
            currentUserId: ctx.state.user!.id,
            programs: programs.filter((p) => p.program_type === "recurring"),
            error: !programId ? "Select a program." : "Event date is required.",
          },
          { status: 422 },
        );
      }

      const { eventId, error } = await createGroupEventForProgram(
        programId,
        eventDate,
        group.id,
        ctx.state.user!.id,
        ctx.state,
      );
      if (error || !eventId) {
        const [members, programs] = await Promise.all([
          getAdminMembers(group.id, ctx.state),
          getGroupPrograms(group.id, ctx.state),
        ]);
        return page(
          {
            groupName: group.name,
            groupSlug: slug,
            groupId: group.id,
            members,
            currentUserId: ctx.state.user!.id,
            programs: programs.filter((p) => p.program_type === "recurring"),
            error: error ?? "Failed to create instance.",
          },
          { status: 500 },
        );
      }

      return new Response(null, {
        status: 302,
        headers: { Location: `/groups/${slug}/admin/events/${eventId}/` },
      });
    }

    // ── Recurring program branch ────────────────────────────────────────
    if (eventType === "recurring") {
      const seedDatetime = ((formData.get("seed_datetime") as string) ?? "")
        .trim();
      const recurrenceRule = ((formData.get("recurrence_rule") as string) ?? "")
        .trim();

      if (!title || !seedDatetime || !recurrenceRule) {
        const [members, programs] = await Promise.all([
          getAdminMembers(group.id, ctx.state),
          getGroupPrograms(group.id, ctx.state),
        ]);
        return page(
          {
            groupName: group.name,
            groupSlug: slug,
            groupId: group.id,
            members,
            currentUserId: ctx.state.user!.id,
            programs: programs.filter((p) => p.program_type === "recurring"),
            error: !title
              ? "Title is required."
              : !seedDatetime
              ? "First occurrence date/time is required."
              : "Recurrence rule is required.",
          },
          { status: 422 },
        );
      }

      const programInput: CreateGroupProgramInput = {
        group_id: group.id,
        created_by_id: ctx.state.user!.id,
        title,
        description: ((formData.get("description") as string) ?? "").trim(),
        recurrence_rule: recurrenceRule,
        seed_datetime: seedDatetime,
        seed_timezone: (formData.get("timezone") as string) ??
          "Australia/Sydney",
        slug_suffix: ((formData.get("slug_suffix") as string) ?? "").trim() ||
          undefined,
        location_type: (formData.get("location_type") as string) || null,
        location_name:
          ((formData.get("location_name") as string) ?? "").trim() || null,
        location_address:
          ((formData.get("location_address") as string) ?? "").trim() || null,
        meeting_link: ((formData.get("meeting_link") as string) ?? "").trim() ||
          null,
        duration_minutes: formData.get("duration_minutes")
          ? parseInt(formData.get("duration_minutes") as string, 10) || null
          : null,
        capacity: formData.get("capacity")
          ? parseInt(formData.get("capacity") as string, 10) || null
          : null,
        organiser_id: (formData.get("organiser_id") as string) || null,
        visibility: (formData.get("visibility") as string) ?? "private",
        slideshow_url:
          ((formData.get("slideshow_url") as string) ?? "").trim() || null,
        resources,
      };

      const { programId, error } = await createGroupProgram(
        programInput,
        ctx.state,
      );
      if (error || !programId) {
        const [members, programs] = await Promise.all([
          getAdminMembers(group.id, ctx.state),
          getGroupPrograms(group.id, ctx.state),
        ]);
        return page(
          {
            groupName: group.name,
            groupSlug: slug,
            groupId: group.id,
            members,
            currentUserId: ctx.state.user!.id,
            programs: programs.filter((p) => p.program_type === "recurring"),
            error: error ?? "Failed to create program.",
          },
          { status: 500 },
        );
      }

      // Redirect to the events/[id] route, which now handles both events and programs
      return new Response(null, {
        status: 302,
        headers: { Location: `/groups/${slug}/admin/events/${programId}/` },
      });
    }

    // ── One-off event branch (original flow, unchanged) ───────────────
    const eventDate = ((formData.get("event_date") as string) ?? "").trim();

    if (!title || !eventDate) {
      const [members, programs] = await Promise.all([
        getAdminMembers(group.id, ctx.state),
        getGroupPrograms(group.id, ctx.state),
      ]);
      return page(
        {
          groupName: group.name,
          groupSlug: slug,
          groupId: group.id,
          members,
          currentUserId: ctx.state.user!.id,
          programs: programs.filter((p) => p.program_type === "recurring"),
          error: !title ? "Title is required." : "Event date is required.",
        },
        { status: 422 },
      );
    }

    const input: CreateGroupEventInput = {
      group_id: group.id,
      created_by_id: ctx.state.user!.id,
      title,
      description: ((formData.get("description") as string) ?? "").trim(),
      event_date: eventDate,
      timezone: (formData.get("timezone") as string) ?? "Australia/Sydney",
      duration_minutes: formData.get("duration_minutes")
        ? parseInt(formData.get("duration_minutes") as string, 10) || null
        : null,
      location_type: (formData.get("location_type") as string) || null,
      location_name: ((formData.get("location_name") as string) ?? "").trim() ||
        null,
      location_address:
        ((formData.get("location_address") as string) ?? "").trim() || null,
      meeting_link: ((formData.get("meeting_link") as string) ?? "").trim() ||
        null,
      capacity: formData.get("capacity")
        ? parseInt(formData.get("capacity") as string, 10) || null
        : null,
      is_registration_required:
        formData.get("is_registration_required") === "on",
      organiser_id: (formData.get("organiser_id") as string) || null,
      visibility: (formData.get("visibility") as string) ?? "private",
      slideshow_url: ((formData.get("slideshow_url") as string) ?? "").trim() ||
        null,
      resources,
    };

    const { programId, error } = await createGroupEvent(input, ctx.state);
    if (error || !programId) {
      const [members, programs] = await Promise.all([
        getAdminMembers(group.id, ctx.state),
        getGroupPrograms(group.id, ctx.state),
      ]);
      return page(
        {
          groupName: group.name,
          groupSlug: slug,
          groupId: group.id,
          members,
          currentUserId: ctx.state.user!.id,
          programs: programs.filter((p) => p.program_type === "recurring"),
          error: error ?? "Failed to create event.",
        },
        { status: 500 },
      );
    }

    // Redirect to the one-off program editor (program_id is always set — ft-07i.27)
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/groups/${slug}/admin/events/${programId}/`,
      },
    });
  },
});

export default define.page<typeof handler>(function NewEventPage({ data }) {
  const {
    groupName,
    groupSlug,
    groupId,
    members,
    currentUserId,
    programs,
    error,
  } = data;
  return (
    <>
      <Head>
        <title>New Event — {groupName} — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div class="mb-6">
          <a
            href="./"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Events
          </a>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold text-near-black mb-8">
          Create Event or Program
        </h1>
        {error && (
          <div class="mb-6 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        <GroupEventForm
          mode="create"
          action={`/groups/${groupSlug}/admin/events/new`}
          groupId={groupId}
          groupSlug={groupSlug}
          currentUserId={currentUserId}
          members={members}
          programs={programs.map((p) => ({ id: p.id, title: p.title }))}
        />
      </div>
    </>
  );
});
