import type { JSX } from "preact";
import { define } from "@/utils.ts";
import type { LayoutConfig } from "fresh";
import AdminLayout from "@/components/AdminLayout.tsx";

export const config: LayoutConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

// ---------------------------------------------------------------------------
// Nav configuration
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { segment: "", label: "Dashboard", icon: "grid" },
  { segment: "groups", label: "Groups", icon: "map-pin" },
  { segment: "events", label: "Events", icon: "calendar" },
  { segment: "members", label: "Members", icon: "users" },
  { segment: "emails", label: "Emails", icon: "mail" },
] as const;

// ---------------------------------------------------------------------------
// Icon component
// ---------------------------------------------------------------------------

function NavIcon({ icon }: { icon: string }): JSX.Element {
  const cls = "w-4 h-4 shrink-0";
  const props = {
    class: cls,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.5",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  switch (icon) {
    case "grid":
      return (
        <svg {...props}>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 4a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1h-4zM13 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
          />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    case "mail":
      return (
        <svg {...props}>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    default: // map-pin
      return (
        <svg {...props}>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
  }
}

// ---------------------------------------------------------------------------
// Breadcrumb bar
// ---------------------------------------------------------------------------

function BreadcrumbBar(
  { crumbs }: { crumbs: Array<{ label: string; href?: string }> },
) {
  return (
    <div
      class="flex items-center gap-1 px-6 py-3 text-sm"
      style="background: white; border-bottom: 1px solid #e0dbd3;"
    >
      <a
        href="/admin"
        class="text-gray-500 hover:text-gray-700 transition-colors"
      >
        Admin
      </a>
      {crumbs.map((crumb, i) => (
        <span key={i} class="flex items-center gap-1">
          <span class="text-gray-400 select-none mx-0.5">›</span>
          {crumb.href
            ? (
              <a
                href={crumb.href}
                class="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {crumb.label}
              </a>
            )
            : <span class="text-gray-800 font-medium">{crumb.label}</span>}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default define.layout((ctx) => {
  const { Component, state, url } = ctx;

  // Determine active nav segment from pathname
  const pathAfterAdmin = url.pathname.replace(/^\/admin\/?/, "");
  const activeSegment = pathAfterAdmin.split("/")[0] ?? "";

  // User display
  const profile = state.profile;
  const userName = profile
    ? [profile.name_first, profile.name_last].filter(Boolean).join(" ")
    : (state.user?.email ?? "");

  const breadcrumbs = state.adminBreadcrumbs;
  const showBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;

  return (
    <AdminLayout>
      <div class="flex h-screen overflow-hidden">
        {/* ---------------------------------------------------------------- */}
        {/* Desktop sidebar */}
        {/* ---------------------------------------------------------------- */}
        <aside
          class="hidden md:flex flex-col w-56 shrink-0"
          style="background: #1c1a18;"
        >
          {/* Branding */}
          <div class="px-4 pt-5 pb-4">
            <a href="/admin" class="flex items-center gap-2">
              <span
                class="text-sm font-bold tracking-wide"
                style="color: white; font-variant: small-caps;"
              >
                Future Together
              </span>
              <span
                class="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full"
              >
                ADMIN
              </span>
            </a>
          </div>

          {/* Nav items */}
          <nav class="flex-1 px-2 pb-4 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = item.segment === activeSegment;
              return (
                <a
                  key={item.segment}
                  href={item.segment ? `/admin/${item.segment}` : "/admin"}
                  aria-current={isActive ? "page" : undefined}
                  class={[
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-white/55 hover:bg-white/[0.08] hover:text-white/85",
                  ].join(" ")}
                >
                  <NavIcon icon={item.icon} />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div
            class="px-4 py-4 space-y-3"
            style="border-top: 1px solid rgba(255,255,255,0.08);"
          >
            {userName && (
              <p
                class="text-xs truncate"
                style="color: rgba(255,255,255,0.35);"
              >
                {userName}
              </p>
            )}
            <a
              href="/"
              class="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
              style="color: #c4853a;"
            >
              ↗ Return to site
            </a>
          </div>
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* Main content column (sidebar + content stacked on mobile) */}
        {/* ---------------------------------------------------------------- */}
        <div class="flex flex-col flex-1 min-w-0 overflow-auto">
          {/* Mobile nav — horizontal scrollable tab bar */}
          <nav
            class="md:hidden flex overflow-x-auto shrink-0"
            style="background: #1c1a18;"
          >
            {/* Mobile branding */}
            <div
              class="flex items-center gap-2 px-4 shrink-0"
              style="border-right: 1px solid rgba(255,255,255,0.08);"
            >
              <span
                class="text-xs font-bold"
                style="color: white; font-variant: small-caps; white-space: nowrap;"
              >
                FT
              </span>
              <span
                class="text-[10px] font-bold text-white bg-primary px-1 py-0.5 rounded"
              >
                ADMIN
              </span>
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = item.segment === activeSegment;
              return (
                <a
                  key={item.segment}
                  href={item.segment ? `/admin/${item.segment}` : "/admin"}
                  aria-current={isActive ? "page" : undefined}
                  class={[
                    "flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap shrink-0 transition-colors border-b-2",
                    isActive
                      ? "text-white border-primary"
                      : "text-white/55 hover:text-white/85 border-transparent",
                  ].join(" ")}
                >
                  <NavIcon icon={item.icon} />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Breadcrumb bar */}
          {showBreadcrumbs && <BreadcrumbBar crumbs={breadcrumbs} />}

          {/* Page content */}
          <main class="flex-1">
            <Component />
          </main>
        </div>
      </div>
    </AdminLayout>
  );
});
