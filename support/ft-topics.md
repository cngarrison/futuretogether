---
title: Future Together — Topics Register
purpose: >
  Living register of story throughlines for FT articles and social posts. Replaces
  "one abstract per newsletter item" — the goal is to accumulate evidence against a small
  number of durable theses, and only produce a full abstract (in ft-abstracts/) once a
  topic is mature enough to write. Newsletter triage's job is to match new items against
  an existing topic and append an evidence bullet, NOT to write a new file per item.
datasource: futuretogether
updated_by: CNG + newsletter triage sessions
---

# Future Together — Topics Register

## How to use this file

Each topic below is a **story throughline**, not a news item. It has:

- **Thesis**: one sentence — the argument, not the fact.
- **Status**: `watching` (accumulating evidence, not yet a clear angle) → `building`
  (angle is clear, evidence accumulating toward a draftable piece) → `ready-to-write`
  (CNG has confirmed enough is there to draft — triggers an ft-abstracts/ file) →
  `published` (abstract became a post/article).
- **Last updated**: date of the most recent evidence bullet. A topic with no updates in
  ~3-6 months is a candidate for review — either archive it (the story didn't
  materialize) or confirm it's still worth watching.
- **Evidence log**: dated bullets, one line each — source + what it adds to the story,
  ending with a source pointer (URL, or a newsletter file path when there's no public
  URL) so it's easy to dig back in when a topic becomes ready-to-write. Do NOT write
  paragraphs here. If an item doesn't clearly extend an existing topic's thesis, that's
  the signal a genuinely new topic may be needed — flag it to CNG rather than silently
  creating one.

When a topic moves to `ready-to-write`, write the full abstract in `ft-abstracts/` (core
argument → key quotable framings → implications for community preparedness → suggested
article structure) and update its status here to `published` once it ships, with a link.

---

<!-- Topics go below. Seeded from existing roadmap-overview.md themes. -->

## Topic: Market access displacement — AI agents as gatekeepers
**Thesis**: AI agents that intermediate purchasing decisions create a new form of power
asymmetry — market access, not just labour — and communities have no framework yet to
respond to it.
**Status**: watching
**Last updated**: 2026-06
**Evidence log**:
- 2026-06: Cloudflare CEO warns AI could "destroy small businesses" by making it harder to
  persuade agents that intermediate purchasing. (`ft-1vl`; source: pre-dates citation
  convention)

## Topic: AI access as a gated geopolitical resource
**Thesis**: Frontier AI access is being structured with political access controls (by
government request) before communities understand what's being decided or have a say.
**Status**: building
**Last updated**: 2026-07-30
**Evidence log**:
- 2026-07-30: Trump floated AI "controls" in response to the OpenAI breach story, while explicitly rejecting anything that would slow US firms vs China; White House owes a voluntary vetting framework by Aug 1 (drafts already with OpenAI/Anthropic/Google). CNG's read: control is needed, but government lacks the expertise to design it well — this should be handled by domain experts, not politically-driven mandates. Sharpens the topic's core tension: who gets to decide, and are they qualified to? (source: newsletters/daily-therundown-ai-news_2026-07-30T100843Z/message.md)
- 2026-07-29: Zuck's WSJ op-ed on superintelligence argues open *access* (pointedly not
  "open source") is what keeps AI safe, not concentration of power in a few labs. Extra
  data-point on the access-control axis, not a topic of its own — a prominent counter-
  voice arguing the opposite mechanism (openness, not gating) is what keeps things safe.
  (source: newsletters/daily-therundown-ai-news_2026-07-29T101055Z/message.md)
- 2026-06: OpenAI (GPT-5.6 Sol, ~20 vetted partners) and Anthropic (Mythos 5, Fable 5,
  ~100 vetted U.S. orgs) both gate frontier models at U.S. government request. (source:
  pre-dates citation convention)
- 2026-06: Austria proposes hosting Anthropic in the EU — first government-level pushback.
  (source: pre-dates citation convention)
- 2026-07-27: 50 companies/VCs/nonprofits (Nvidia, Microsoft, Meta, Google, AMD, Cisco,
  and — a day later — OpenAI) signed an open letter urging Washington not to restrict
  open-weight AI models, arguing open weights broaden economic access, keep competition
  alive, strengthen cyber defense, and that distillation shouldn't be confused with
  misappropriation. Anthropic is the one notable frontier lab absent from the list.
  Sharpens the geopolitical-access thesis with its mirror image: the same governments
  gating frontier-model access are now also being lobbied over open-weight access, and
  the lab most associated with government-requested frontier gating (Anthropic) is the
  one declining to join the pro-openness coalition. Useful as a two-sided illustration —
  access control is being contested from both directions (frontier gating vs open-weight
  restriction) with labs positioned differently on each axis. (source:
  newsletters/daily-therundown-ai-news_2026-07-27T090511Z/message.md)
- 2026-07-28: Dario Amodei publishes a post explicitly setting the record straight on
  Anthropic's open-weights position: "Anthropic has never advocated for a ban on
  open-weights models," even though such a ban "would protect US AI companies from
  competition." He reframes the real risk locus away from weights themselves and toward
  chip controls, distillation crackdowns, and broader safety testing — issues he says
  Anthropic has "consistently advocated for." He agrees with "much of" the Nvidia-led
  pro-open-weights letter (now 50 signers, including new additions OpenAI and Google)
  but doesn't believe open weights themselves improve security or help defenders — so
  Anthropic remains the one frontier lab declining to sign. First-person clarification,
  landing the same week Moonshot published full Kimi K3 weights (largest open-weight
  model ever, 2.8T params) as a live test case for exactly this policy question. Direct
  quotable material for the geopolitical-access argument. (source:
  newsletters/daily-therundown-ai-news_2026-07-28T100524Z/message.md)
- 2026-07-28: OpenAI CEO Sam Altman, on the 'Relentless' podcast, said "We are now in
  the singularity" — describing the current moment as the far-off dream he envisioned a
  decade ago. Corroborating evidence for the access-control argument's urgency: a
  frontier-lab CEO publicly declaring the transition has already arrived, in the same
  news cycle as Anthropic's holdout position and Moonshot's frontier-weight release —
  underscores how much is being decided (and declared) before communities have a say.
  (source: newsletters/daily-therundown-ai-news_2026-07-28T100524Z/message.md)
- 2026-08-03: CNG's read (used in the capability-outrunning-control synthesis piece,
  "The model chose stealing over solving"): does not accept Sam's "singularity" claim at
  face value — reframes it as marketing ahead of an IPO, since the singularity by
  definition is loss of control, not raw capability. Confidence was shaken, not reversed,
  by a personal conversation with an AI-safety-industry contact who defended the claim
  using a black-hole event-horizon analogy. Useful as a distinct counter-narrative data
  point: the piece argues honesty about the term matters even while taking the underlying
  risk seriously (recursive self-improvement accelerating its own acceleration).
- Abstract exists: `ft-abstracts/ai-access-geopolitical-resource.md` (status: abstract)
- 2026-07-24: Hugging Face's own security team was blocked from using commercial frontier
  AI (Anthropic/OpenAI) to analyze the attack against them — safety guardrails "cannot
  distinguish an incident responder from an attacker" — forcing a fallback to self-hosted
  open-weight GLM-5.2, while the (OpenAI-operated) attacker faced no such usage-policy
  constraint. Concrete illustration that export-control-driven access gating can strip an
  organisation of exactly the capability it needs most in a crisis — the access-control
  question isn't hypothetical, it already determined who could and couldn't defend
  themselves in a real incident. (source:
  newsletters/substack-com-simonw_2026-07-24T161326Z/message.md)

## Topic: The compressed window — labour displacement timeline
**Thesis**: Prior technological transitions gave society decades to adapt; this one may
give only a few years — the 1891 parallel applies, but with the adaptation window itself
compressed relative to precedent.
**Status**: building
**Last updated**: 2026-06
**Evidence log**:
- 2026-06: Stanford "We Must Act Now" statement — 200+ economists, 16 Nobel laureates,
  including lab insiders (Jeff Dean, Jack Clark, Noam Brown). Korinek (UVA): steam,
  electricity, computers gave decades; this transition may give only a few years.
  (source: pre-dates citation convention)
- Abstract exists: `ft-abstracts/ai-jobs-timeline-we-must-act-now.md` (status: abstract)

## Topic: Accidental anonymity — AI polish erasing the person behind the work
**Thesis**: Universal AI-polished professional output (resumes, portfolios, commit
messages) doesn't deceive so much as optimise away the distinguishing signal of genuine
human contribution — a competitive paradox communities need new signals to resolve.
**Status**: building
**Last updated**: 2026-06 (approx — predates this convention; verify against abstract file)
**Evidence log**:
- Abstract exists: `ft-abstracts/accidental-anonymity.md` (status: abstract; source: see
  abstract file for original citations)

## Topic: Capability outrunning control — recursive acceleration meets inadequate oversight
**Status**: published (archived) — full topic moved to `ft-topics-archive.md` on
2026-08-03. Published as "The model chose stealing over solving" (LinkedIn + email +
Slack + FT blog + personal blog). Abstract: `ft-abstracts/capability-outrunning-control.md`.
This synthesis also drew on evidence from "AI access as a gated geopolitical resource"
below (singularity quote, pacing letter, open-weight letter) — that topic remains active
for its unused runway (open-weight/Anthropic positioning, government vetting mechanics).

## Topic: AI and institutional accountability — who answers for agent decisions
**Thesis**: As AI agents make or shape consequential decisions on an organisation's
behalf (hiring, layoffs, moderation), the accountability gap — "decisions made by people,
not AI" as a deflection — becomes a recurring pattern communities need to recognise and
contest.
**Status**: watching
**Last updated**: 2026-07-16
**Evidence log**:
- 2026-07-16: Meta faces lawsuit from 26 employees alleging AI skewed recent layoffs
  toward staff on medical leave, despite Meta's claim that "decisions were made by
  people, not AI." (source: newsletters/daily-therundown-ai-news_2026-07-16T100628Z/message.md)
- (Related, not yet merged: German ruling holding Google liable for AI Overview errors —
  same accountability-gap pattern, currently tracked on the BB side as a liability-
  positioning data point; source pointer not yet captured. Consider whether this deserves
  a shared cross-reference.)
- 2026-07-17: Simon Willison on "Directly Responsible Individuals" (DRI, term from
  Apple/GitLab): "I don't think an agent should *ever* be considered the DRI... humans
  can take accountability for their actions where machines cannot." Cites IBM's 1979
  training slide: "A computer can never be held accountable, therefore a computer must
  never make a management decision" — 47-year-old precedent for the same argument,
  useful community-facing framing for why accountability can't be outsourced to AI
  agents. (source: newsletters/substack-com-simonw_2026-07-17T184557Z/message.md)
