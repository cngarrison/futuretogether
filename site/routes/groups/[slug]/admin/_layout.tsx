import { define } from "@/utils.ts";

/**
 * Group admin layout — Fresh v2
 * Wraps all /groups/[slug]/admin/* routes with a sidebar + content shell.
 *
 * Inherits the root _layout.tsx (PageLayout with PageHeader/PageFooter) normally —
 * no skipAppWrapper or skipInheritedLayouts. The sidebar sits inside the standard
 * site chrome as additional navigation, per CNG design decision (2026-06-17).
 */

const NAV_ITEMS = [
  { segment: "", label: "Dashboard" },
  { segment: "members", label: "Members" },
  { segment: "events", label: "Events" },
  { segment: "email", label: "Email" },
  { segment: "settings", label: "Settings" },
  { segment: "support", label: "Support" },
] as const;

export default define.layout((ctx) => {
  const { Component, state, params, url } = ctx;
  const slug = params.slug as string;
  const groupName = state.group?.name ?? "Group Admin";
  const basePath = `/groups/${slug}/admin`;

  // Determine active nav segment from URL path
  const afterBase = url.pathname.slice(basePath.length).replace(/^\//, "");
  const activeSegment = afterBase.split("/")[0] ?? "";

  return (
    <div class="flex min-h-[calc(100vh-4rem)] bg-[#f7f4ef]">
      {/* Sidebar — hidden on mobile, shown md+ */}
      <aside
        class="hidden md:flex flex-col w-56 shrink-0 border-r"
        style="border-color: #e0dbd3; background-color: #fff;"
      >
        {/* Group name + back link */}
        <div class="px-4 pt-6 pb-5 border-b" style="border-color: #e0dbd3;">
          <p
            class="text-xs font-semibold uppercase tracking-widest mb-1.5"
            style="color: rgba(28,26,24,0.4);"
          >
            Group admin
          </p>
          <p class="text-sm font-bold text-near-black leading-snug mb-3">
            {groupName}
          </p>
          <a
            href={`/groups/${slug}/`}
            class="text-xs text-primary font-medium transition-opacity hover:opacity-70"
          >
            &#8592; Back to group page
          </a>
        </div>

        {/* Nav */}
        <nav
          class="flex-1 px-2.5 py-4 space-y-0.5"
          aria-label="Group admin navigation"
        >
          {NAV_ITEMS.map(({ segment, label }) => {
            const isActive = segment === ""
              ? activeSegment === ""
              : activeSegment === segment;
            const href = segment ? `${basePath}/${segment}/` : `${basePath}/`;
            return (
              <a
                key={segment}
                href={href}
                class={[
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#eef5f7] text-primary font-semibold"
                    : "text-near-black/70 hover:bg-[#f3f0eb] hover:text-near-black",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </a>
            );
          })}
        </nav>

        {/* Role badge */}
        {state.membership && (
          <div class="px-4 pb-6">
            <span
              class="inline-block text-xs text-primary font-medium px-2.5 py-1 rounded-full"
              style="background-color: #eef5f7;"
            >
              {state.membership.role === "group_owner"
                ? "Group owner"
                : "Group admin"}
            </span>
          </div>
        )}
        {state.isSiteAdminBypass && (
          <div class="px-4 pb-6">
            <span
              class="inline-block text-xs font-medium px-2.5 py-1 rounded-full"
              style="background-color: #fff8e6; color: #7a5a00; border: 1px solid #f0d78a;"
            >
              Site admin
            </span>
          </div>
        )}
      </aside>

      {/* Mobile: horizontal scrollable nav bar */}
      <div class="flex flex-col flex-1 min-w-0">
        <nav
          class="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b bg-white"
          style="border-color: #e0dbd3;"
          aria-label="Group admin navigation"
        >
          {NAV_ITEMS.map(({ segment, label }) => {
            const isActive = segment === ""
              ? activeSegment === ""
              : activeSegment === segment;
            const href = segment ? `${basePath}/${segment}/` : `${basePath}/`;
            return (
              <a
                key={segment}
                href={href}
                class={[
                  "shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-[#eef5f7] text-primary font-semibold"
                    : "text-near-black/70 hover:bg-[#f3f0eb]",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </a>
            );
          })}
        </nav>

        {/* Page content */}
        <main class="flex-1">
          <Component />
        </main>
      </div>
    </div>
  );
});
