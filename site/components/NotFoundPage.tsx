import type { Context } from "fresh";
import type { State } from "@/utils.ts";

export function handleNotFound(ctx: Context<State>) {
  return ctx.render(<NotFoundPage />, { status: 404 });
}

export default function NotFoundPage() {
  return (
    <div class="bg-warm-white">
      {/* Teal hero — consistent with other pages */}
      <div class="pt-32 pb-20 px-4 text-center text-white bg-primary">
        <p
          class="text-7xl font-extrabold mb-4 tracking-tight"
          style="opacity: 0.25;"
        >
          404
        </p>
        <h1 class="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
          This page has gone off to face<br class="hidden sm:block" />{" "}
          the future alone.
        </h1>
        <p class="text-lg sm:text-xl max-w-xl mx-auto" style="opacity: 0.85;">
          We've been saying that's not the best strategy.
        </p>
      </div>

      {/* Body */}
      <div class="max-w-2xl mx-auto px-4 py-16 text-center">
        <p class="text-lg text-near-black mb-10">
          The page you're looking for doesn't exist — but unlike the disruptions
          we prepare for, this one has an easy fix.
        </p>

        {/* Primary CTA */}
        <a
          href="/"
          class="inline-block px-8 py-3 rounded-lg font-semibold text-white mb-6 transition-opacity hover:opacity-90 bg-primary"
        >
          ← Back to home
        </a>

        {/* Divider */}
        <p class="text-sm mb-6" style="color: #888;">
          Or head somewhere useful:
        </p>

        {/* Quick links */}
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
    </div>
  );
}
