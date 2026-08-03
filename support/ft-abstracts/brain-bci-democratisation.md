---
title: "Whose Brain Data Is It? Non-Invasive BCI and the Democratisation Trap"
source: "The Rundown AI, 30 Jun 2026"
status: abstract
---

# Whose Brain Data Is It? Non-Invasive BCI and the Democratisation Trap

## Core argument

Meta's Brain2Qwerty v2 decodes full sentences from a non-invasive brain scan, reaching 61% average word accuracy (78% for the top volunteer) — up from 8% highs among prior non-invasive rivals, and closing in on results that used to require a surgical implant. Meta has open-sourced the code and dataset for both v1 and v2.

The headline framing is democratisation: brain-computer interfaces without surgery could one day help many more people who have lost speech communicate again. That framing is true and worth taking seriously — but it is also premature, and the gap between "possible" and "practical" is exactly where communities need to pay attention *now*, before the access model solidifies.

Three things are true simultaneously:

1. **The capability curve is real.** Meta's own finding — that accuracy climbs with more data and the surgical gap "could be further narrowed through data scaling alone" — means this is not a one-off result. More labs, given the open-sourced code, will now push the same curve.
2. **The hardware bottleneck hasn't moved.** Non-invasive still means sitting inside a scanner (the study used 9 volunteers, 10 hours each, to produce ~22,000 sentences). MEG/fMRI-class scanners cost millions and live in research hospitals, not clinics or homes. "Non-invasive" is not the same as "accessible." The democratisation story is about removing the *surgical* barrier, not the *economic or geographic* one.
3. **A new category of personal data is being created with no governance conversation attached.** Ten hours of continuous brain scanning per volunteer produces something categorically different from a health record or a browsing history: a dataset of someone's raw neural activity while forming words. Meta open-sourcing the code is a research-acceleration move: it says nothing about who owns the *data* produced when this moves from lab to product, what it can be repurposed for, or what consent looks like when the assistive use case is the entry point for consumer products later (as it has been with EEG wearables, sleep trackers, and other health-adjacent sensors).

This is the 1891 pattern again: a capability is crossing a threshold that will matter enormously to real people (this time, people who have lost the ability to speak), while the frameworks that will govern who benefits, who profits, and who is protected from misuse do not yet exist. The window to shape those frameworks is open now, while the technology is still expensive and rare — not later, once it's cheap and everywhere.

## Key quotable framings

- "Non-invasive does not mean accessible. It means the barrier moved from the operating table to the price tag."
- "The accuracy number is the easy story. The hard story is who gets to collect ten hours of someone's brain activity, and what happens to it after the sentence is typed."
- "Every assistive technology has a second life as a consumer product. The governance conversation needs to happen before that handoff, not after."
- "Open-sourcing the model accelerates the science. It says nothing about who owns the data the science was built on."

## Implications for community preparedness

- **Health/assistive tech literacy is becoming brain-data literacy.** Communities already thinking about health data collection (see FT's existing health-data-literacy abstract) need to extend that thinking to neural data specifically — a category with no established consumer protection norms.
- **The "who benefits first" question applies directly.** Assistive BCI for people who've lost speech is an unambiguous good. The question is what happens when the same underlying tech, refined on that dataset, moves into commercial products (workplace monitoring, consumer wearables, advertising inference) — a pattern seen before with other body-data technologies.
- **Open-source acceleration cuts both ways.** More labs building on Meta's published code means faster capability gains, but also means the data-governance conversation needs to happen at the level of the *field*, not a single company's policy — no single actor controls how this diffuses.

## Suggested article structure

1. Open with the Brain2Qwerty v2 result and why it matters for people who've lost speech — the genuine good news, stated plainly.
2. Introduce the "possible vs practical" gap: non-invasive still means an expensive scanner and a research setting, not a clinic visit.
3. Name the new data category directly: raw neural activity during word formation is not like any dataset communities have norms for yet.
4. Draw the 1891 parallel: capability crossing threshold before governance exists, and why the window to act is now, while the technology is still rare.
5. Close with a concrete ask: what would responsible brain-data governance look like before this becomes a mainstream consumer category, and who needs to be in that conversation before it's decided by default.
