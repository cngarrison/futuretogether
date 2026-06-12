import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

export default define.page(function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service | Future Together</title>
        <meta
          name="description"
          content="The terms under which you can use Future Together — written in plain English, not legal jargon."
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
            Terms of Service
          </h1>
          <p
            class="text-lg leading-relaxed"
            style="color: rgba(255,255,255,0.8);"
          >
            Plain English. No surprises. Last updated: June 2026.
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
            <h2 class="text-near-black">Overview</h2>
            <p>
              Future Together is a free community platform for people who want
              to understand and prepare for AI-driven change — together. It's
              operated by Charles N. Garrison, based in NSW, Australia.
            </p>
            <p>
              By using this site or creating an account, you agree to these
              terms. If you don't agree, please don't use the platform.
            </p>

            <h2 class="text-near-black">Using the platform</h2>
            <p>To use Future Together, you agree to:</p>
            <ul>
              <li>Be 16 years of age or older</li>
              <li>Provide accurate information when you create your account</li>
              <li>
                Keep your account secure — you're responsible for all activity
                that happens under your account
              </li>
              <li>Have one account per person</li>
            </ul>

            <h2 id="community-standards" class="text-near-black">
              Community standards
            </h2>
            <p>
              Future Together is a space for honest, curious, good-faith
              conversation. To keep it that way, we ask everyone to follow our
              Code of Conduct. That means:
            </p>
            <ul>
              <li>
                <strong>No political or partisan framing.</strong>{" "}
                Future Together is explicitly non-partisan. Keep AI discussions
                separated from political affiliation.
              </li>
              <li>
                <strong>No doom-framing without action.</strong>{" "}
                Honest urgency is welcome; catastrophising without constructive
                intent is not.
              </li>
              <li>
                <strong>
                  No harassment, personal attacks, or hate speech.
                </strong>{" "}
                Treat everyone with respect, even when you disagree.
              </li>
              <li>
                <strong>No invented statistics or misinformation.</strong>{" "}
                Back claims with sources. If you're not sure, say so.
              </li>
              <li>
                <strong>AI-assisted content is fine</strong>{" "}
                — we use AI tools too. Presenting AI-generated content as your
                own original human writing without disclosure is not.
              </li>
              <li>
                <strong>Media enquiries</strong>{" "}
                should be referred to Future Together admin at{" "}
                <a href="mailto:media@futuretogether.community">
                  media@futuretogether.community
                </a>.
              </li>
            </ul>

            <h2 class="text-near-black">Group founders</h2>
            <p>
              If you start a local group through Future Together, you take on
              some additional responsibilities:
            </p>
            <ul>
              <li>
                You agree to run your group in line with the Code of Conduct
              </li>
              <li>
                You are responsible for your group's members and the
                communications sent through the group
              </li>
              <li>
                You must not use the group email system to send spam or
                unsolicited commercial content
              </li>
              <li>
                Future Together reserves the right to suspend or archive groups
                that violate these terms
              </li>
              <li>
                Group approval is at our discretion — we may decline any
                application without explanation
              </li>
            </ul>

            <h2 class="text-near-black">Content you contribute</h2>
            <p>
              You own what you create. When you post content on Future Together
              (comments, group descriptions, event details), you keep ownership
              of it. By posting, you grant Future Together a licence to display
              that content on the platform for as long as it's there. We reserve
              the right to remove content that violates these terms or our Code
              of Conduct.
            </p>

            <h2 class="text-near-black">Our rights</h2>
            <p>
              We may suspend or terminate accounts or groups that violate these
              terms. Where possible, we'll give notice and explain why — but we
              reserve the right to act immediately if the situation requires it.
            </p>

            <h2 class="text-near-black">No warranties</h2>
            <p>
              Future Together is provided as-is. We work hard to keep it
              reliable and useful, but we can't guarantee uninterrupted uptime
              or that everything will always work perfectly. We're not liable
              for losses resulting from platform downtime or technical issues.
            </p>

            <h2 class="text-near-black">Governing law</h2>
            <p>
              These terms are governed by the laws of New South Wales,
              Australia.
            </p>

            <h2 class="text-near-black">Changes to these terms</h2>
            <p>
              If we make material changes to these terms, we'll notify members
              by email before the changes take effect. Continuing to use the
              platform after that notification means you accept the updated
              terms.
            </p>

            <h2 class="text-near-black">Contact</h2>
            <p>
              Questions about these terms? Reach us at{" "}
              <a href="mailto:legal@futuretogether.community">
                legal@futuretogether.community
              </a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
});
