import { define } from "@/utils.ts";
import { Head } from "fresh/runtime";
import { getEventById, getEventsBySlug } from "@/utils/events.ts";

// Dynamic route: /meetups/[eventName]
//
// A resource and recap page for any event slug. Shows the event's details,
// description, and topics — with the slideshow embedded below (if available),
// including an overlaid "Open in presentation mode" button on the iframe.

function formatEventDate(dateStr: string, timezone: string): string {
  try {
    return new Date(dateStr).toLocaleString("en-AU", {
      timeZone: timezone ?? "Australia/Sydney",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default define.page(async function EventResources(ctx) {
  const eventName = ctx.params.eventName;
  const requestedId = ctx.url.searchParams.get("id");
  const now = new Date();

  let event = null;

  // If a specific event ID was requested, look it up directly
  if (requestedId) {
    const candidate = await getEventById(requestedId);
    // Only use it if it matches the slug and is in the past
    if (
      candidate &&
      candidate.slug === eventName &&
      new Date(candidate.date) <= now
    ) {
      event = candidate;
    }
  }

  // Fall back to the most recent past event for this slug
  if (!event) {
    const events = await getEventsBySlug(eventName);
    const pastEvents = events
      .filter((e) => new Date(e.date) <= now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    event = pastEvents[0] ?? null;
  }

  // Graceful 404 — slug doesn't exist or event is still upcoming
  if (!event) {
    return (
      <>
        <Head>
          <title>Event Not Found — Future Together</title>
        </Head>
        <div class="max-w-3xl mx-auto px-4 py-24 text-center">
          <p
            class="text-sm font-semibold uppercase tracking-widest mb-4"
            style="color: #1a5f6e;"
          >
            Not found
          </p>
          <h1 class="text-3xl font-bold mb-4" style="color: #1c1a18;">
            No resources yet
          </h1>
          <p class="mb-8" style="color: rgba(28,26,24,0.65);">
            This event either hasn’t happened yet or doesn’t exist. Resources
            will appear here after the session.
          </p>
          <a
            href="/meetups"
            class="inline-block px-6 py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
            style="background-color: #1a5f6e;"
          >
            &larr; Back to Meetups
          </a>
        </div>
      </>
    );
  }

  const dateDisplay = formatEventDate(
    event.date,
    event.timezone ?? "Australia/Sydney",
  );

  // Split description into paragraphs for rendering
  const descriptionParagraphs = event.description
    .split("\n\n")
    .map((p: string) => p.trim())
    .filter(Boolean);

  const isSpecial = event.slug !== "discuss-our-future";

  return (
    <>
      <Head>
        <title>{event.title} — Future Together</title>
        <meta
          name="description"
          content={`Resources and slideshow from the ${event.title} Future Together event — ${dateDisplay}.`}
        />
      </Head>

      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div style="background-color: #f7f4ef; border-bottom: 1px solid #d0e4e7;">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <a
            href="/meetups"
            class="text-sm font-medium inline-flex items-center gap-1 mb-5"
            style="color: #1a5f6e;"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Meetups
          </a>

          {isSpecial && (
            <span
              class="inline-block text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4"
              style="background-color: #eef5f7; color: #1a5f6e;"
            >
              Special Event
            </span>
          )}

          <h1
            class="text-3xl sm:text-4xl font-bold mb-4 leading-tight"
            style="color: #1c1a18;"
          >
            {event.title}
          </h1>

          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
            style="color: rgba(28,26,24,0.55);"
          >
            <span>{dateDisplay}</span>
            {event.duration && (
              <span style="color: rgba(28,26,24,0.3);">&middot;</span>
            )}
            {event.duration && <span>{event.duration} minutes</span>}
            {event.presentedBy && (
              <>
                <span style="color: rgba(28,26,24,0.3);">&middot;</span>
                <span>Presented by {event.presentedBy}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Description + topics                                               */}
      {/* ------------------------------------------------------------------ */}
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Description */}
        <div class="max-w-2xl mb-10 space-y-4">
          {descriptionParagraphs.map((para: string) => (
            <p
              key={para}
              class="leading-relaxed"
              style="color: rgba(28,26,24,0.8);"
            >
              {para}
            </p>
          ))}
        </div>

        {/* Poster image / infographic */}
        {event.posterImage && (
          <div
            class="rounded-xl overflow-hidden mb-10"
            style="border: 1px solid #d0e4e7;"
          >
            <img
              src={event.posterImage}
              alt={`Visual summary: ${event.title}`}
              class="w-full h-auto"
            />
          </div>
        )}

        {/* Topics */}
        {event.topics && event.topics.length > 0 && (
          <div
            class="rounded-xl p-6 mb-4"
            style="background-color: #eef5f7; border: 1px solid #d0e4e7;"
          >
            <p
              class="text-xs font-semibold uppercase tracking-widest mb-4"
              style="color: rgba(28,26,24,0.4);"
            >
              What we covered
            </p>
            <ul class="space-y-2">
              {event.topics.map((topic: string) => (
                <li
                  key={topic}
                  class="text-sm leading-snug"
                  style="color: rgba(28,26,24,0.75);"
                >
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Supporting images / charts */}
        {event.supportingImages &&
          event.supportingImages.map((imgSrc: string) => (
            <div
              key={imgSrc}
              class="rounded-xl overflow-hidden mb-6"
              style="border: 1px solid #d0e4e7;"
            >
              <img
                src={imgSrc}
                alt={`Supporting chart: ${event.title}`}
                class="w-full h-auto"
              />
            </div>
          ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Downloads & reference links                                        */}
      {/* ------------------------------------------------------------------ */}
      {event.resources && event.resources.length > 0 && (
        <div class="max-w-4xl mx-auto px-4 sm:px-6 pb-4">
          <p
            class="text-xs font-semibold uppercase tracking-widest mb-4"
            style="color: rgba(28,26,24,0.4);"
          >
            Resources
          </p>
          <ul class="space-y-3">
            {event.resources.map((resource) => (
              <li key={resource.url}>
                <a
                  href={resource.url}
                  {...(resource.type === "download"
                    ? { download: true }
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  class="flex items-start gap-3 rounded-xl px-4 py-3 transition-colors hover:opacity-90"
                  style="background-color: #eef5f7; border: 1px solid #d0e4e7;"
                >
                  {/* Icon: download vs external link */}
                  <span class="mt-0.5 shrink-0" style="color: #1a5f6e;">
                    {resource.type === "download"
                      ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      )
                      : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      )}
                  </span>
                  <span>
                    <span class="text-sm font-semibold block" style="color: #1a5f6e;">
                      {resource.label}
                    </span>
                    {resource.description && (
                      <span class="text-xs block mt-0.5" style="color: rgba(28,26,24,0.55);">
                        {resource.description}
                      </span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Slideshow iframe (with overlaid presentation-mode button)          */}
      {/* ------------------------------------------------------------------ */}
      {event.slideshowUrl
        ? (
          <div class="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
            <p
              class="text-xs font-semibold uppercase tracking-widest mb-4"
              style="color: rgba(28,26,24,0.4);"
            >
              Session slideshow
            </p>
            <div
              class="relative rounded-xl overflow-hidden shadow-lg"
              style="border: 1px solid #d0e4e7;"
            >
              {/* Overlaid presentation-mode button */}
              <a
                href={event.slideshowUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                style="background: rgba(26, 95, 110, 0.85); backdrop-filter: blur(4px);"
              >
                Open in presentation mode
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>

              <iframe
                src={event.slideshowUrl}
                title={`${event.title} — Slideshow`}
                class="w-full"
                style="height: 76vh; border: none; display: block;"
              />
            </div>
          </div>
        )
        : (
          /* Placeholder when slideshow isn't published yet */
          <div class="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
            <div
              class="rounded-xl px-6 py-5"
              style="background-color: #f7f4ef; border: 1px solid #d0e4e7;"
            >
              <p class="text-sm" style="color: rgba(28,26,24,0.45);">
                The session slideshow will be linked here once it’s available.
              </p>
            </div>
          </div>
        )}
    </>
  );
});
