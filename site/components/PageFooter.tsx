export default function PageFooter() {
  const year = new Date().getFullYear();

  return (
    <footer class="bg-near-black text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div class="flex flex-col md:flex-row justify-between gap-10">

          {/* Brand block */}
          <div class="max-w-xs">
            <img
              src="/logo-white.svg"
              alt="Future Together"
              class="h-8 w-auto mb-4"
            />
            <p class="text-sm text-gray-400 leading-relaxed">
              A community for people paying attention to AI and technological
              change — and who want to face it together.
            </p>
          </div>

          {/* Nav links */}
          <nav aria-label="Footer navigation">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              Navigate
            </p>
            <ul class="space-y-2 text-sm">
              <li>
                <a href="/meetups" class="text-gray-300 hover:text-white transition-colors">
                  Meetups
                </a>
              </li>
              <li>
                <a href="/about" class="text-gray-300 hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/join" class="text-gray-300 hover:text-white transition-colors">
                  Join
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div class="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>Future Together is a community initiative, not a commercial product.</p>
          <p>
            &copy; {year} Future Together &middot; Website by{" "}
            <a
              href="https://futuretogether.community"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-gray-300 transition-colors"
            >
              Beyond Better
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
