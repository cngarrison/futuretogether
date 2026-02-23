/**
 * POST /api/staff/members/[memberId]/remove
 *
 * Soft-removes a member (sets status to "removed"). The record is retained
 * in KV for data integrity. Protected by the staff API middleware.
 */

import { define } from "@/utils.ts";
import { getMemberById, removeMember } from "@/utils/members.ts";

export const handlers = define.handlers({
  async POST(ctx) {
    const { memberId } = ctx.params;

    const member = await getMemberById(memberId);
    if (!member) {
      return new Response("Member not found", { status: 404 });
    }

    const result = await removeMember(member.email);
    if (!result.success) {
      return new Response(result.error ?? "Remove failed", { status: 400 });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  },
});
