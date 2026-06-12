import { define } from "@/utils.ts";
import { getNextAvailableEvent } from "@/utils/db/group-events.ts";
import { getRegistrationCount } from "@/utils/db/group-registrations.ts";

export const handler = define.handlers({
  async GET(ctx) {
    try {
      const { eventSlug } = ctx.params;

      const event = await getNextAvailableEvent(eventSlug, ctx.state);

      if (!event) {
        return new Response(
          JSON.stringify({
            available: false,
            message: "No upcoming events",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const registrationCount = await getRegistrationCount(event.id, ctx.state);
      // Convert BigInt to number for arithmetic operations
      const count = Number(registrationCount);
      const spotsRemaining = event.capacity - count;
      const isFull = spotsRemaining <= 0;

      return new Response(
        JSON.stringify({
          available: !isFull,
          eventId: event.id,
          eventDate: event.date,
          spotsRemaining,
          isFull,
          showLimitedSeats: spotsRemaining <= 10,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Event status check error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
});
