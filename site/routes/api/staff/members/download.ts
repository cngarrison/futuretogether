/**
 * GET /api/staff/members/download
 *
 * Returns all active members as a CSV file.
 * Protected by the staff API middleware.
 */

import { define } from "@/utils.ts";
import { getAllMembers } from "@/utils/members.ts";

function escapeCsv(value: string | undefined): string {
  if (!value) return "";
  // Wrap in quotes if the value contains a comma, quote, or newline
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export const handlers = define.handlers({
  async GET(_ctx) {
    const allMembers = await getAllMembers();
    const members = allMembers.filter((m) => m.status !== "removed");

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Role",
      "Location",
      "Heard From",
      "Interests",
      "Joined",
      "Source",
    ];

    const rows = members.map((m) => [
      escapeCsv(m.firstName),
      escapeCsv(m.lastName),
      escapeCsv(m.email),
      escapeCsv(m.role),
      escapeCsv(m.location),
      escapeCsv(m.heardFrom),
      escapeCsv(m.interests.join("; ")),
      escapeCsv(new Date(m.joinedAt).toLocaleDateString("en-AU")),
      escapeCsv(m.source),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const filename = `ft-members-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  },
});
