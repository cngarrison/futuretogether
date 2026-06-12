import type { ComponentChildren } from "preact";
import { define } from "@/utils.ts";
import PageLayout from "@/components/PageLayout.tsx";

/**
 * Root layout — wraps all public routes with PageHeader and PageFooter.
 *
 * File-based equivalent of the former `app.layout("*", PageLayout)` in main.ts.
 * Subdirectory layouts (slideshows, staff) opt out via `skipInheritedLayouts: true`
 * in their own config exports.
 */
export default define.layout(({ Component, url, state }) => {
  return (
    <PageLayout
      currentPath={url.pathname}
      Component={Component as () => ComponentChildren}
      user={state.user}
      profile={state.profile}
    />
  );
});
