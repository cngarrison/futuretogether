import { define } from "@/utils.ts";
import { createAdminClient } from "@/utils/supabase.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const eventId = ctx.params.id;
    const slug = ctx.params.slug;
    const groupId = ctx.state.group!.id;
    const errorRedirect = (msg: string) =>
      new Response(null, {
        status: 302,
        headers: {
          Location: `/groups/${slug}/admin/events/${eventId}/?error=${
            encodeURIComponent(msg)
          }`,
        },
      });

    let formData: FormData;
    try {
      formData = await ctx.req.formData();
    } catch {
      return errorRedirect("Failed to parse upload.");
    }

    const file = formData.get("poster") as File | null;
    if (!file || file.size === 0) {
      return errorRedirect("No file selected.");
    }
    if (file.size > 5 * 1024 * 1024) {
      return errorRedirect("File too large (max 5MB).");
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const storagePath = `${groupId}/events/${eventId}/poster.webp`;
    // Admin client is for storage only — Supabase Storage operations require
    // the service role key server-side; the session client cannot upload to buckets.
    const adminClient = createAdminClient();

    const { error: uploadError } = await adminClient.storage
      .from("groups")
      .upload(storagePath, buffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      return errorRedirect(`Upload failed: ${uploadError.message}`);
    }

    // RLS allows group admins to UPDATE their own group's events, so the
    // session client is sufficient for the metadata update.
    const { error: updateError } = await ctx.state.supabaseClient
      .from("group_events")
      .update({ poster_image_path: storagePath })
      .eq("id", eventId);

    if (updateError) {
      return errorRedirect(
        `Failed to save poster path: ${updateError.message}`,
      );
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: `/groups/${slug}/admin/events/${eventId}/?saved=1`,
      },
    });
  },
});
