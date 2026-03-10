import { App, staticFiles, trailingSlashes } from "fresh";
import { define, type State } from "@/utils.ts";
import PageLayout from "@/components/PageLayout.tsx";
import StaffLayout from "@/components/StaffLayout.tsx";
import { handleNotFound } from "@/components/NotFoundPage.tsx";
import { handleError } from "@/components/ErrorPage.tsx";
import { sendReminders } from "@/utils/cron.ts";

// Event reminder cron jobs (Deno Deploy native scheduling)
Deno.cron(
  "day-before reminders",
  "0 * * * *",
  () => sendReminders("day_before"),
);
Deno.cron(
  "hour-before reminders",
  "0 * * * *",
  () => sendReminders("hour_before"),
);

export const app = new App<State>();

app.notFound(handleNotFound);
app.onError("*", handleError);

app.use(staticFiles());
app.use(trailingSlashes("never"));

// // Pass a shared value from a middleware
// app.use(async (ctx) => {
//   ctx.state.shared = "hello";
//   return await ctx.next();
// });
//
// // this is the same as the /api/:name route defined via a file. feel free to delete this!
// app.get("/api2/:name", (ctx) => {
//   const name = ctx.params.name;
//   return new Response(
//     `Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`,
//   );
// });

// this can also be defined via a file. feel free to delete this!
const exampleLoggerMiddleware = define.middleware((ctx) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`);
  return ctx.next();
});
app.use(exampleLoggerMiddleware);

//app.layout("blog/*", PageLayout, { showHero: false });
app.layout("*", PageLayout, { showHero: false });

app.layout("/staff/*", StaffLayout, {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
});

// Include file-system based routes here
app.fsRoutes();
