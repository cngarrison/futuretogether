import PageHeader from "./PageHeader.tsx";
import PageFooter from "./PageFooter.tsx";

interface LayoutProps {
  currentPath: string;
  Component: () => unknown;
  showHero?: boolean;
  route?: string;
}

export default function PageLayout(
  { currentPath, showHero = false, Component, route }: LayoutProps,
) {
  return (
    <>
      <PageHeader currentPath={route ?? currentPath} />
      <main>
        <Component />
      </main>
      <PageFooter />
    </>
  );
}
