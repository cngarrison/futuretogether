import type { FreshContext } from "fresh";
import type { State } from "@/utils.ts";

export function handleError(ctx: FreshContext<State>) {
  // ctx.error is set by Fresh before invoking this handler  
  const status = ctx.error.status || 500;
  console.error(`[${status}] ${ctx.req.url}`, ctx.error);
  return ctx.render(<ErrorPage />, { status });
}

export default function ErrorPage() {
  return (
    <div style="background-color: #f7f4ef;">
      {/* Teal hero */}
      <div
        class="pt-32 pb-20 px-4 text-center"
        style="background-color: #1a5f6e; color: white;"
      >
        <p class="text-7xl font-extrabold mb-4 tracking-tight" style="opacity: 0.25;">
          OOPS
        </p>
        <h1 class="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
          Something went wrong on our end.
        </h1>
        <p class="text-lg sm:text-xl max-w-xl mx-auto" style="opacity: 0.85;">
          The server had an unexpected moment. Unlike the disruptions
          we prepare for, this one isn&rsquo;t your fault.
        </p>
      </div>

      {/* Body */}
      <div class="max-w-2xl mx-auto px-4 py-16 text-center">
        <p class="text-lg mb-10" style="color: #1c1a18;">
          Try refreshing &mdash; it&rsquo;s usually a blip. <br />
          If it keeps happening, feel free to{" "}
          <a
            href="/contact"
            class="underline hover:no-underline"
            style="color: #1a5f6e;"
          >
            let us know
          </a>.
        </p>

        {/* Primary CTAs */}
        <div class="flex flex-wrap justify-center gap-4 mb-10">
          <button
            id="error-retry-btn"
            class="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
            style="background-color: #1a5f6e;"
          >
            Try again
          </button>
          <a
            href="/"
            class="inline-block px-8 py-3 rounded-lg font-semibold border transition-colors hover:border-[#1a5f6e] hover:text-[#1a5f6e]"
            style="border-color: #ccc; color: #555;"
          >
            Back to home
          </a>
        </div>

        {/* Quick links */}
        <p class="text-sm mb-6" style="color: #888;">
          Or head somewhere useful:
        </p>
        <div class="flex flex-wrap justify-center gap-3">
          {[
            { href: "/meetups", label: "Meetups" },
            { href: "/blog", label: "Articles" },
            { href: "/resources", label: "Resources" },
            { href: "/about", label: "About" },
            { href: "/join", label: "Join the community" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:border-[#1a5f6e] hover:text-[#1a5f6e]"
              style="border-color: #ccc; color: #555;"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <script>
        {`document.getElementById('error-retry-btn')?.addEventListener('click', function() {
          window.location.reload();
        });`}
      </script>
    </div>
  );
}
