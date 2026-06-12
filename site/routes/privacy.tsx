import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

export default define.page(function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Future Together</title>
        <meta
          name="description"
          content="How Future Together collects, uses, and protects your personal information. Plain English, no surprises."
        />
      </Head>

      {/* Hero */}
      <section class="text-white bg-primary">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <p
            class="text-sm font-semibold uppercase tracking-widest mb-4"
            style="color: rgba(255,255,255,0.6);"
          >
            Legal
          </p>
          <h1 class="text-4xl sm:text-5xl font-bold mb-5">
            Privacy Policy
          </h1>
          <p
            class="text-lg leading-relaxed"
            style="color: rgba(255,255,255,0.8);"
          >
            We collect only what we need, we don't sell your data, and we try to
            be clear about everything. Last updated: June 2026.
          </p>
        </div>
      </section>

      {/* Content */}
      <section class="py-16 sm:py-20 bg-warm-white">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <div
            class="prose prose-lg max-w-none"
            style="color: rgba(28,26,24,0.85);"
          >
            <h2 class="text-near-black">Who we are</h2>
            <p>
              Future Together is operated by Charles N. Garrison, based in NSW,
              Australia. If you have any questions about how your data is
              handled, you can reach us at{" "}
              <a href="mailto:privacy@futuretogether.community">
                privacy@futuretogether.community
              </a>.
            </p>

            <h2 class="text-near-black">What data we collect and why</h2>
            <p>
              We collect only what we need to run the platform and communicate
              with you. Here's what that means in practice:
            </p>
            <ul>
              <li>
                <strong>Account data</strong>{" "}
                — your email address, display name, and age confirmation (16+).
                We need this to create your account and communicate with you.
              </li>
              <li>
                <strong>Group memberships</strong>{" "}
                — which local groups you join, your role in each group, and your
                email opt-in status. We use this to facilitate group
                communications and send you emails you've asked to receive.
              </li>
              <li>
                <strong>Event registrations</strong>{" "}
                — your name and email when you register for an event. We use
                this to manage attendance and send event reminders.
              </li>
              <li>
                <strong>Email activity</strong>{" "}
                — send logs and consent timestamps. We keep this for legal
                compliance, so we can demonstrate that we had permission to
                contact you.
              </li>
              <li>
                <strong>Usage data</strong> — we use{" "}
                <a
                  href="https://plausible.io/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Plausible Analytics
                </a>
                , a privacy-respecting analytics tool. Plausible does not use
                cookies, does not track you across sites, and does not collect
                any personal data. We just get aggregate counts — how many
                people visited which pages.
              </li>
            </ul>

            <h2 class="text-near-black">How we use your data</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>
                Operate the Future Together platform and keep your account
                working
              </li>
              <li>Send you emails that you've explicitly opted into</li>
              <li>Send event reminders for events you've registered for</li>
              <li>Meet our legal obligations around email consent</li>
            </ul>
            <p>
              We don't use your data for advertising, profiling, or anything
              beyond what's listed here.
            </p>

            <h2 class="text-near-black">Who we share data with</h2>
            <p>
              We use a small number of trusted third-party services to run the
              platform. Your data may be processed by:
            </p>
            <ul>
              <li>
                <strong>
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Supabase
                  </a>
                </strong>{" "}
                — our database and authentication provider. Servers are located
                in the EU (Frankfurt). Supabase processes your account data,
                group memberships, and email logs.
              </li>
              <li>
                <strong>
                  <a
                    href="https://resend.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Resend
                  </a>
                </strong>{" "}
                — our email delivery provider. When we send you an email, it
                goes through Resend.
              </li>
              <li>
                <strong>
                  <a
                    href="https://plausible.io/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Plausible Analytics
                  </a>
                </strong>{" "}
                — anonymous, cookie-free website analytics. No personal data is
                shared with Plausible.
              </li>
            </ul>
            <p>
              We do not sell your data. We do not share it with advertisers.
              Full stop.
            </p>

            <h2 class="text-near-black">Email communications</h2>
            <p>
              We only send emails you've opted into. Every email we send
              includes a one-click unsubscribe link. You can also manage your
              email preferences at any time from your{" "}
              <a href="/account/groups/">group settings</a>.
            </p>

            <h2 class="text-near-black">Your rights</h2>
            <p>
              You have control over your data. Here's what you can do:
            </p>
            <ul>
              <li>
                <strong>Access your data</strong> — visit{" "}
                <a href="/account/data/">/account/data/</a>
              </li>
              <li>
                <strong>Correct your data</strong>{" "}
                — update your account details at{" "}
                <a href="/account/">/account/</a>
              </li>
              <li>
                <strong>Delete your account</strong> — visit{" "}
                <a href="/account/delete/">/account/delete/</a>
              </li>
              <li>
                <strong>Withdraw consent / unsubscribe</strong> — use your{" "}
                <a href="/account/groups/">group settings</a>{" "}
                or the unsubscribe link in any email we send
              </li>
              <li>
                <strong>EU/EEA users</strong>{" "}
                — you have the right to lodge a complaint with your national
                data protection supervisory authority if you believe we're
                handling your data incorrectly
              </li>
            </ul>
            <p>
              For any privacy-related questions or requests, contact us at{" "}
              <a href="mailto:privacy@futuretogether.community">
                privacy@futuretogether.community
              </a>.
            </p>

            <h2 class="text-near-black">How long we keep your data</h2>
            <p>
              We keep your account data for as long as your account is active.
              When you delete your account, your personal data is deleted or
              anonymised. Email send logs are retained for two years for legal
              compliance purposes.
            </p>

            <h2 class="text-near-black">Security</h2>
            <p>
              We take reasonable steps to protect your data. The platform uses
              Supabase's row-level security (so users can only access their own
              data), httpOnly session cookies (so session tokens aren't
              accessible to JavaScript), and HTTPS throughout.
            </p>

            <h2 class="text-near-black">Children</h2>
            <p>
              Future Together is not directed at anyone under 16. We ask for age
              confirmation at signup. If you believe a child under 16 has
              created an account, please contact us and we'll remove it.
            </p>

            <h2 class="text-near-black">Changes to this policy</h2>
            <p>
              If we make material changes to this privacy policy, we'll notify
              members by email before the changes take effect. Minor
              clarifications may be made without notice.
            </p>

            <h2 class="text-near-black">Contact</h2>
            <p>
              Questions? Reach us at{" "}
              <a href="mailto:privacy@futuretogether.community">
                privacy@futuretogether.community
              </a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
});
