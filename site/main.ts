import { App, staticFiles, trailingSlashes } from "fresh";
import { define, type State } from "@/utils.ts";
import { handleNotFound } from "@/components/NotFoundPage.tsx";
import { handleError } from "@/components/ErrorPage.tsx";
import { generateRecurringInstances, sendReminders } from "@/utils/cron.ts";
import { errorMessage, isProduction } from "@/utils/app.ts";

// Cron jobs only run in production. Set APP_ENV=production in the Deno Deploy
// environment variables for the production deployment only — not for staging or
// branch previews. This prevents reminder emails firing from non-prod environments.
// TODO: Cron jobs temporarily disabled to unblock production deploy.
// Re-enable once Deno Deploy cron validation issue is resolved.
/* 
if (isProduction()) {
  try {
    // Event reminder cron jobs (Deno Deploy native scheduling)
    // @ts-ignore Deno.cron is unstable — enabled via deno.json "unstable": ["cron"]
    Deno.cron(
      "day-before reminders",
      "0 * * * *",
      {
        backoffSchedule: [1000, 10000, 60000],
      },
      () => sendReminders("day_before"),
    );
    // @ts-ignore Deno.cron is unstable — enabled via deno.json "unstable": ["cron"]
    Deno.cron(
      "hour-before reminders",
      "0 * * * *",
      {
        backoffSchedule: [1000, 5000, 10000],
      },
      () => sendReminders("hour_before"),
    );
    // @ts-ignore Deno.cron is unstable — enabled via deno.json "unstable": ["cron"]
    Deno.cron(
      "generate-recurring-instances",
      "0 2 * * *", // Every day at 02:00 UTC
      {
        backoffSchedule: [1000, 10000, 60000],
      },
      () => generateRecurringInstances(),
    );
  } catch (error) {
    console.error("Couldn't set cron jobs: ", errorMessage(error));
  }
} else {
  console.log(
    '[cron] Skipping cron registration — APP_ENV is not "production"',
  );
}
 */

export const app = new App<State>();

app.notFound(handleNotFound);
app.onError("*", handleError);

app.use(staticFiles());
app.use(trailingSlashes("never"));

// this can also be defined via a file. feel free to delete this!
const exampleLoggerMiddleware = define.middleware((ctx) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`);
  return ctx.next();
});
app.use(exampleLoggerMiddleware);

//app.layout("blog/*", PageLayout, { showHero: false });
// Include file-system based routes here
app.fsRoutes();
