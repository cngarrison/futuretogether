import type { ComponentChildren } from "preact";
import type { UserAuth, UserProfile } from "@/utils.ts";
import PageHeader from "./PageHeader.tsx";
import PageFooter from "./PageFooter.tsx";

interface LayoutProps {
  currentPath: string;
  Component: () => ComponentChildren;
  showHero?: boolean;
  route?: string;
  user?: UserAuth | null;
  profile?: UserProfile | null;
}

export default function PageLayout(
  { currentPath, showHero: _showHero = false, Component, route, user, profile }:
    LayoutProps,
) {
  return (
    <>
      <PageHeader
        currentPath={route ?? currentPath}
        user={user}
        profile={profile}
      />
      <main class="pt-16">
        {Component()}
      </main>
      <PageFooter />
    </>
  );
}
