import { ensureFile } from "@std/fs";

const STAFF_ACCESS_FILE = Deno.env.get("FT_STAFF_ACCESS_FILE") ||
  "data/staff-access.log";

export async function logStaffAccess(message: string) {
  try {
    await ensureFile(STAFF_ACCESS_FILE);
    const logEntry = `${message}\n`;
    await Deno.writeTextFile(STAFF_ACCESS_FILE, logEntry, { append: true });
  } catch (error) {
    // Fallback to console if file writing fails
    console.error("Failed to write to access log:", error);
    console.log(message);
  }
}
