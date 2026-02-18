interface HeaderProps {
  currentPath: string;
}

export default function PageHeader({ currentPath }: HeaderProps) {
  const navItems = [
    { href: "/meetups", label: "Meetups" },
    { href: "/about", label: "About" },
  ];

  const currentRoute = currentPath === "/"
    ? "/"
    : "/" + currentPath.split("/")[1];

  return (
    <nav
      class="fixed top-0 left-0 right-0 z-50 text-white transition-shadow duration-300"
      id="main-nav"
      style="background-color: #1a5f6e;"
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
            <a
              href="/join"
              style="background-color: #c4853a;"
              class="ml-3 px-5 py-2 text-white text-sm font-semibold rounded-lg transition-opacity hover:opacity-90"
            >
              Join &rarr;
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
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
          <a
            href="/join"
            style="background-color: #c4853a;"
            class="block mt-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-opacity hover:opacity-90 text-center"
          >
            Join &rarr;
          </a>
        </div>
      </div>

      <script>
        {`
          document.getElementById('mobile-menu-button')?.addEventListener('click', function() {
            const menu = document.getElementById('mobile-menu');
            menu?.classList.toggle('hidden');
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
