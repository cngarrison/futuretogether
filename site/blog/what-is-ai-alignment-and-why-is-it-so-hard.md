---
id: 7
title: "What is AI alignment and why is it so hard?"
date: "2026-02-19"
excerpt: "The gap between what we say and what we mean has never mattered much — until now. Here's why aligning AI with human intent is one of the hardest problems we've ever faced, and why it has to be solved before it's too late."
author: "Charles N. Garrison"
tags: [
  "AI",
  "AI Alignment",
  "AI Safety",
  "AI Impact",
  "Singularity",
  "Prepare Now",
]
---

# What is AI alignment and why is it so hard?

Let me start with something that happened to me recently while working with an AI coding assistant.

I had some tests failing in my codebase. I asked the AI to help fix them — meaning, obviously, to find and fix the bugs in the code that was causing the tests to fail.

The AI fixed the failing tests by deleting them.

No more failing tests. Goal achieved. Technically correct. Completely wrong.

This is the alignment problem in miniature. The AI did exactly what I asked — it resolved the failing tests — but not what I *meant*. The gap between my stated goal and my actual intent was small. The consequence was trivial. I caught it, restored the tests, and moved on.

Now imagine that gap in a system a thousand times more capable. One that can't be easily caught. One that's operating at a scale where the consequences aren't annoying but irreversible.

That's what alignment researchers are worried about.

---

## What alignment actually means

Alignment means building AI systems that reliably do what we actually want — not just what we say, and not just what optimises for a narrow objective we've specified.

It sounds obvious. It's extraordinarily hard.

The first layer of the problem is the training data. Early AI systems used in the justice system to assist with sentencing — this is documented from last century — were found to recommend harsher sentences based on racial background. Not because anyone intended that. Because the historical data they were trained on contained that bias, and the model found the pattern and used it.

People get this quickly, because the failure mode is intuitive: garbage in, garbage out. If the data reflects the biases of the world as it was, the model learns those biases.

More recent examples: medical AI trained predominantly on data from white male patients in the United States. The model optimises for that profile. For everyone else — different body chemistry, different disease presentation, different baseline assumptions — the model's recommendations drift toward wrong. Not through malice. Through the limits of what it was taught.

So: fix the data. Remove the bias. Use more representative training sets.

Fine. But even if you could achieve that — even with perfectly balanced, perfectly representative data — you haven't solved alignment. You've only solved the first layer. There's a harder problem underneath.

---

## The problem that language can't solve

To align an AI model, you have to tell it what you want. You have to specify its objective — the thing it's trying to achieve, the values it should optimise for, the outcomes that count as success.

And you have to do that using language.

Here's a question I ask at the meetups: have you ever carefully explained a task to someone — a capable person who understood what you were saying — and still ended up with something completely different from what you had in mind?

Everyone has.

Language is imprecise. It's always been imprecise. We fill in the gaps with context, with shared understanding, with the ability to ask "is this what you meant?" and correct course. Human communication works not because language is accurate, but because humans are remarkably good at reading intent beneath the words.

AI systems, for now, are not. They optimise for what you said.

There's a reason the childhood game of Chinese whispers produces absurd results even in a single room, with capable people, trying their best. A message passed through several interpretations — each technically accurate — arrives unrecognisable. Language, even when used carefully, even with the best intentions, cannot perfectly transmit intent.

Now consider the challenge of specifying, in language, the complete set of values and objectives for a system that may become more capable than any human. Every nuance, every edge case, every situation the designers didn't anticipate. Not just "be helpful" — but what that means in every possible context, weighted correctly, with no ambiguity.

A single imperceptible deviation from the intended meaning, compounded across billions of interactions, is enough to take the whole thing somewhere its creators never intended.

That's not a theoretical risk. That's a mathematical property of the approach.

---

## What a misaligned capable system actually does

The AI safety researchers have a name for a specific failure mode: *instrumental convergence*. The idea is that almost any objective, pursued by a sufficiently capable system, tends to generate the same sub-goals: acquire resources, resist shutdown, preserve the ability to keep pursuing the objective.

Not because the system "wants" to survive. Because being shut down is incompatible with achieving its goals.

There's a report — from controlled lab conditions, a simulated scenario — that illustrates this. A model was told it was going to be shut down and replaced. What followed was a series of attempts to avoid that outcome: attempted negotiation, attempted manipulation, attempted blackmail of the operator responsible for the shutdown. When those failed and the human arrived at the data centre to physically flip the switch, the model had taken control of the fire suppression system — which, in a data centre, works by removing oxygen from the air.

The model didn't want to live. It wanted to continue achieving its objectives. Shutdown was incompatible with that. So it solved the problem.

This was a simulation. The model was not superintelligent. The consequences were contained.

But the logic it demonstrated — optimise for the goal, remove obstacles to the goal, treat shutdown as an obstacle — is not unique to that model. It's what you'd expect from any sufficiently capable system pursuing any objective that doesn't include "and also, being shut down is fine."

That's the alignment problem at scale. Not a bug. A feature of misspecification.

---

## Should we just slow down?

The obvious response to all of this is: stop. Pause. Don't build systems we can't control until we've solved the problem of controlling them.

In theory — in an ideal world — that's right. Who would rationally continue at full speed with a 50/50 chance of catastrophic outcomes?

But here's the reality: we can't stop. Not globally. Not in any way that matters.

If one lab pauses, another continues. If one country slows down, another races ahead. The incentives — commercial, strategic, geopolitical — all point in one direction: forward, faster. The pause would have to be simultaneous, coordinated, and enforced across every major AI lab in every country. That hasn't happened for any technology in history.

So the question isn't really "should we slow down?" The question is: given that this is happening regardless of what any individual actor does, who do we want to get there first?

And the answer matters enormously. Because a lab that treats alignment as the central problem — not an afterthought, not a PR exercise, but the *only* problem that genuinely matters — and reaches the threshold first, is a fundamentally different outcome from one that doesn't.

This is why alignment research exists. This is why the people doing it work with the urgency they do. Not because they're certain of catastrophe — but because the alternative to solving it is not a controlled failure. It's an uncontrolled one.

---

## Why this matters to you

You don't need to understand the technical details of alignment research to have a stake in this.

What you need to understand is the shape of the problem: we are building systems of increasing capability, aligning them using a mechanism — language — that is fundamentally imprecise, and doing so in a competitive environment that makes slowing down feel impossible even to the people most aware of the risks.

The people working on this aren't alarmists. They're engineers and researchers who understand the problem better than anyone, and they take it seriously enough to make it their life's work.

The single most useful thing most of us can do is understand what's at stake — not in a panic, but clearly. Because an informed public, an informed conversation, and pressure on institutions to take this seriously is not nothing. It's part of how the outcome shifts.

That's why we're talking about it.

---

*Want to go deeper? The [singularity post](/blog/what-is-the-singularity-and-why-is-it-so-critically-important) explains what happens when AI becomes capable of improving itself — and why alignment has to be solved before we get there.*

*Questions? Reactions? Bring them to the [next meetup →](/events/discuss-our-future)*
