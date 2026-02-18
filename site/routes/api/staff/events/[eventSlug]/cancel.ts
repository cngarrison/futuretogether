import { define } from "../../../../../utils.ts";
import {
  cancelRegistration,
  getEventById,
} from "../../../../../utils/events.ts";

export const handlers = define.handlers({
  async POST(ctx) {
    try {
      const { eventSlug } = ctx.params;
      const { eventId, registrationId } = await ctx.req.json();
      console.log("APIEventCancel", { eventId, registrationId });

      if (!eventId || !registrationId) {
        console.error(
          "APIEventCancel - Must supply both eventId and registrationId",
          { eventId, registrationId },
        );
        return new Response(
          JSON.stringify({ error: "Missing eventId or registrationId" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Verify event exists
      const event = await getEventById(eventId);
      if (!event) {
        console.error("APIEventCancel - could not find event", { eventId });
        return new Response(
          JSON.stringify({ error: "Event not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      // Cancel the registration
      const result = await cancelRegistration(eventId, registrationId);
      console.log("APIEventCancel - result", { result });

      if (!result.success) {
        const status = result.error === "Registration not found"
          ? 404
          : result.error === "Registration already cancelled"
          ? 400
          : 500;
        return new Response(
          JSON.stringify({ error: result.error }),
          { status, headers: { "Content-Type": "application/json" } },
        );
      }

      // Registration is now marked as cancelled - spot is available for new registrations

      return new Response(
        JSON.stringify({ success: true, message: "Registration cancelled" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Error cancelling registration:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
