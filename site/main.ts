import { App, staticFiles, trailingSlashes } from "fresh";
import { define, type State } from "@/utils.ts";
import PageLayout from "@/components/PageLayout.tsx";
import StaffLayout from "@/components/StaffLayout.tsx";

export const app = new App<State>();

app.notFound((ctx) => {
  return new Response("Page not found", { status: 404 });
});

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
