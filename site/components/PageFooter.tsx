export default function PageFooter() {
  const year = new Date().getFullYear();

  return (
    <footer class="bg-near-black text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div class="flex flex-col md:flex-row justify-between gap-10">
          {/* Col 1: Brand block */}
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

          {/* Col 2: CTA — hidden on mobile */}
          <div class="hidden md:flex flex-col">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              Get Involved
            </p>
            <p class="text-sm text-gray-400 leading-relaxed mb-5 max-w-[200px]">
              You don't have to figure this out alone.
            </p>
            <a
              f-client-nav={false}
              href="/join"
              class="inline-block text-sm font-semibold text-accent border border-accent rounded px-4 py-2 hover:bg-accent hover:text-near-black transition-colors"
            >
              Join the community →
            </a>
          </div>

          {/* Col 3: Nav links in 2-col grid + LinkedIn */}
          <nav aria-label="Footer navigation">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              Navigate
            </p>
            <ul class="grid grid-cols-2 gap-x-10 gap-y-2 text-sm mb-5">
              <li>
                <a
                  f-client-nav={false}
                  href="/meetups"
                  class="text-gray-300 hover:text-white transition-colors"
                >
                  Meetups
                </a>
              </li>
              <li>
                <a
                  f-client-nav={false}
                  href="/about"
                  class="text-gray-300 hover:text-white transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  f-client-nav={false}
                  href="/blog"
                  class="text-gray-300 hover:text-white transition-colors"
                >
                  Articles
                </a>
              </li>
              <li>
                <a
                  f-client-nav={false}
                  href="/join"
                  class="text-gray-300 hover:text-white transition-colors"
                >
                  Join
                </a>
              </li>
              <li>
                <a
                  f-client-nav={false}
                  href="/resources"
                  class="text-gray-300 hover:text-white transition-colors"
                >
                  Resources
                </a>
              </li>
              <li>
                <a
                  f-client-nav={false}
                  href="/contact"
                  class="text-gray-300 hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  f-client-nav={false}
                  href="/start-a-group"
                  class="text-gray-300 hover:text-white transition-colors"
                >
                  Local Group
                </a>
              </li>
            </ul>
            <div class="border-t border-gray-800 pt-4">
              <a
                f-client-nav={false}
                href="https://www.linkedin.com/company/future-together"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  class="w-4 h-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            </div>
          </nav>
        </div>

        {/* Bottom bar */}
        <div class="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>
            Future Together is a community initiative, not a commercial product.
          </p>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a
              f-client-nav={false}
              href="/privacy"
              class="hover:text-gray-300 transition-colors"
            >
              Privacy Policy
            </a>
            <span aria-hidden="true">&middot;</span>
            <a
              f-client-nav={false}
              href="/terms"
              class="hover:text-gray-300 transition-colors"
            >
              Terms of Service
            </a>
            <span aria-hidden="true">&middot;</span>
            <span>
              &copy; {year} Future Together &middot;{" "}
              <a
                f-client-nav={false}
                href="https://beyondbetter.app"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-gray-300 transition-colors"
              >
                Website by Beyond Better
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
