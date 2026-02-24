import { define } from "@/utils.ts";
import { HttpError } from "fresh";

// Dev-only route — throws an error to exercise the onError handler.
// Returns 404 in production (when DENO_DEPLOYMENT_ID is set by Deno Deploy).
export default define.page(function TestErrorPage() {
  const isProduction = !!Deno.env.get("DENO_DEPLOY");

  if (isProduction) {
    // Silently 404 in production — don't advertise this route exists
    console.error('Ignoring "test-error" in production');
    throw new HttpError(404);
  }

  const messages = [
    "The server has encountered a situation it does not know how to handle.",
    "An unexpected condition prevented the request from being fulfilled.",
    "Something broke. Congratulations, you found it.",
    "The hamster powering this server has stopped running.",
    "A wild error appeared!",
  ];

  const message = messages[Math.floor(Math.random() * messages.length)];
  throw new HttpError(501, message); // use 501 just to test the `status` value is working
});
