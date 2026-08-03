# Who Controls the Inference?
### The New Consent Question in Professional AI Tools

**Source**: Robert Matsuoka, "The Year of the Fire Horse - Part 3: The Governance Reckoning," HyperDev (Substack), 26 Jun 2026
**Status**: abstract
**FT themes**: Power asymmetry, governance frameworks, community agency, the 1891 parallel

---

## Core Argument

The AI governance debate has been framed as a geopolitics question. Matsuoka's Part 3 argument: the flag-over-lab framing is demonstrably broken. The real question is older and broader — who controls the layer that sees your work, and can the answer change without your consent?

The DeepSeek governance concern and the Cursor/SpaceX governance concern are structurally identical. DeepSeek has a foreign-intelligence-law wrapper: China's National Intelligence Law (2017) requires Chinese companies to "support, assist and cooperate" with state intelligence regardless of what their privacy policy says. Cursor has a change-of-control wrapper: a single owner controls the layer that sees all your code, and no-train guarantees can be revised by that owner. Both reduce to: your IP flows through infrastructure you do not control, governed by terms the owner can change.

---

## Key Quotable Framings

- "Provenance was a proxy. After this year, the proxy is gone. You have to ask the real question now, and you have to ask it of everyone — including the editor you have trusted by default."
- "Beijing on one side, Boca Chica on the other."
- "The model layer inside your IDE is a governance surface, and ownership of that surface is now in motion."
- "You can no longer reason about model risk by asking which flag flies over the lab."
- "Developers are voting with their tokens even when they will not put their name on a blog post." (Chinese models ~61% of OpenRouter top-10 token consumption, one February week)

---

## Implications for Community Preparedness

The consent gap is invisible by default. Most professionals have consented to a product's ToS, not to the specific governance terms of the model processing their work. The model layer can change (acquisition, policy revision, new owner) without triggering a visible consent moment.

The self-hosting assumption is also broken. CrowdStrike found DeepSeek-R1 produced insecure code at ~50% higher rates on politically sensitive prompts — and the bias persisted in locally run open weights. Controlling the inference path does not mean controlling what is baked into the model's behaviour.

The 1891 parallel: new intermediaries are reshaping professional infrastructure before governance frameworks have solidified. AI inference providers are becoming intermediaries between professionals and their own outputs — the same structural position industrial capital occupied relative to workers. Who controls that layer, on what terms, with what accountability, is the defining governance question of this period.

The power asymmetry is consent asymmetry. Inference providers and IDE vendors set the terms; individual professionals and community organisations discover them after the infrastructure is embedded in their workflow.

---

## Suggested Article Structure

1. Open with a concrete moment: a professional discovers the AI tool they have trusted for six months was just acquired and the privacy terms have changed. What do they do?

2. The consent question: AI tools present one consent moment (sign up, accept ToS). The governance reality is dynamic. Frame this as a structural gap in how consent works for embedded infrastructure.

3. The symmetry argument: this is not a China problem or a US problem. It is a model-layer-ownership problem that applies equally to a Chinese lab under the National Intelligence Law and a US tool under change-of-control by a billionaire.

4. The 1891 parallel: new intermediaries reshaping professional infrastructure before frameworks solidify. What did communities do then? What is available now that was not?

5. What communities can do: not "avoid AI" but "know your inference path." Questions to ask of any AI tool. Advocate for governance frameworks that treat the model layer as regulated infrastructure.

6. Close with the open question: we are in the window where the frameworks are still being written. What do communities need to be asking — now, before the infrastructure is so embedded the question becomes academic?
