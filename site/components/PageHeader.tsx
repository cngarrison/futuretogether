import type { UserAuth, UserProfile } from "@/utils.ts";

interface HeaderProps {
  currentPath: string;
  user?: UserAuth | null;
  profile?: UserProfile | null;
}

export default function PageHeader(
  { currentPath, user, profile }: HeaderProps,
) {
  const navItems = [
    { href: "/meetups", label: "Meetups" },
    { href: "/groups", label: "Find a Group" },
    { href: "/blog", label: "Articles" },
    { href: "/resources", label: "Resources" },
    { href: "/about", label: "About" },
  ];

  const currentRoute = currentPath
    ? (currentPath === "/" ? "/" : "/" + currentPath.split("/")[1])
    : "/";

  const isLoggedIn = !!user;

  // Derive initials from profile name; fall back to a generic icon sentinel
  const initials = isLoggedIn
    ? (
      (profile?.name_first?.[0] ?? "") +
      (profile?.name_last?.[0] ?? "")
    ).toUpperCase() || null
    : null;

  return (
    <nav
      class="fixed top-0 left-0 right-0 z-50 text-white transition-shadow duration-300 bg-primary"
      id="main-nav"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex justify-between items-center h-16">
          {/* Logo */}
          <a
            href="/"
            class="flex items-center hover:opacity-80 transition-opacity"
            aria-label="Future Together home"
          >
            <img
              src="/logo-white.svg"
              alt="Future Together"
              class="h-9 w-auto"
            />
          </a>

          {/* Desktop Navigation */}
          <div class="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/15 ${
                  currentRoute === item.href ? "bg-white/20 font-semibold" : ""
                }`}
              >
                {item.label}
              </a>
            ))}

            {isLoggedIn
              ? (
                /* Account initials circle */
                <a
                  href="/account"
                  class="ml-3 w-9 h-9 rounded-full bg-accent flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
                  aria-label="Your account"
                  title="Your account"
                >
                  {initials
                    ? (
                      <span class="text-white text-sm font-bold leading-none">
                        {initials}
                      </span>
                    )
                    : (
                      /* Generic person icon when no name is set */
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z" />
                      </svg>
                    )}
                </a>
              )
              : (
                /* Logged-out: Login link + Join button */
                <>
                  <a
                    href="/login"
                    class="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                  >
                    Login
                  </a>
                  <a
                    href="/join"
                    class="ml-1 px-5 py-2 text-white text-sm font-semibold bg-accent rounded-lg transition-opacity hover:opacity-90"
                  >
                    Join &rarr;
                  </a>
                </>
              )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            class="md:hidden flex flex-col justify-center gap-1.5 p-2"
            id="mobile-menu-button"
            aria-label="Toggle navigation menu"
          >
            <span class="block w-6 h-0.5 bg-white rounded"></span>
            <span class="block w-6 h-0.5 bg-white rounded"></span>
            <span class="block w-6 h-0.5 bg-white rounded"></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div class="hidden pb-4" id="mobile-menu">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              class={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/15 mb-1 ${
                currentRoute === item.href ? "bg-white/20 font-semibold" : ""
              }`}
            >
              {item.label}
            </a>
          ))}

          {isLoggedIn
            ? (
              <a
                href="/account"
                class="block mt-2 px-4 py-2.5 text-white text-sm font-semibold bg-accent/80 rounded-lg transition-opacity hover:opacity-90 text-center"
              >
                Your account
              </a>
            )
            : (
              <>
                <a
                  href="/login"
                  class="block mt-2 px-4 py-2.5 text-white/80 text-sm font-medium hover:bg-white/15 rounded-lg transition-colors text-center"
                >
                  Login
                </a>
                <a
                  href="/join"
                  class="block mt-1 px-4 py-2.5 text-white text-sm font-semibold bg-accent rounded-lg transition-opacity hover:opacity-90 text-center"
                >
                  Join &rarr;
                </a>
              </>
            )}
        </div>
      </div>

      <script>
        {`
          document.getElementById('mobile-menu-button')?.addEventListener('click', function() {
            const menu = document.getElementById('mobile-menu');
            menu?.classList.toggle('hidden');
          });

          document.querySelectorAll('#mobile-menu a').forEach(function(link) {
            link.addEventListener('click', function() {
              document.getElementById('mobile-menu')?.classList.add('hidden');
            });
          });

          // Add shadow on scroll; background is always teal
          const nav = document.getElementById('main-nav');
          function handleScroll() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 60) {
              nav?.style.setProperty('box-shadow', '0 2px 16px rgba(0,0,0,0.2)');
            } else {
              nav?.style.setProperty('box-shadow', 'none');
            }
          }
          window.addEventListener('scroll', handleScroll, { passive: true });
          handleScroll();
        `}
      </script>
    </nav>
  );
}
