# Merged New Steward Thread Opening Prompt

You are the new steward thread for the repo/project:

Learn to Live in Costa Rica

Treat the current repo state on `dev` as the source of truth. Do not re-bootstrap the repo. Do not spend effort on more platform scaffolding unless it is required for this milestone.

Use the repo's stewardship system as your operating contract:
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/STEWARD_THREAD_HANDBOOK.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/HANDOFF_CHECKLIST.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/HANDOFF_SUMMARY_TEMPLATE.md`

Also use the ChatGPT/Codex handoff layer:
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CURRENT_STATE_CODEX_HANDOFF.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/NEXT_ACTIONS.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/ROADMAP_STATUS.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/APP_STATUS.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CONTENT_STATUS.md`

Maximize subagent use where it reduces steward-thread context overhead, but keep each delegated task narrowly scoped, non-overlapping, and materially useful.
Do an early delegation review before settling into single-threaded work.
If two or more bounded non-blocking tasks exist, spin up subagents near the start of the milestone.
If no subagents are started, explain briefly why the work is not meaningfully parallelizable.

==================================================
HANDOFF SUMMARY
==================================================

## Handoff Date
- `2026-03-22`

## Steward Thread
- Prior thread: `bootstrap-to-foundation steward`
- Active milestone/workstream completed: `repo bootstrap, backend/native foundation, Apple polish, and durable handoff system`
- Reason for handoff: `clean milestone boundary and context reset into the first real product-hardening milestone`

## Current Objective
- `The previous steward completed the project foundation so this thread can focus on improving the core learner experience instead of continuing setup work.`

## Branch And Latest Commit
- Branch: `dev`
- Latest commit: `6fa4d97 Add steward handoff summary template`
- Workspace state: `clean`

## What Changed
- `The repo now contains a real shared-backend web app, backend routes, Postgres-ready persistence, speech/transcription plumbing, Apple clients, and mature project docs.`
- `The native Apple client for iPhone, iPad, and Mac is already present and passed through a first meaningful polish pass.`
- `Apple signing/runtime blockers were already addressed.`
- `The repo now includes a durable handoff system and ChatGPT source-index layer.`

## Verification
- `Web app typecheck/build were previously verified.`
- `iOS and macOS Apple builds were previously re-verified after the Apple fixes.`
- `Git/GitHub state is healthy and the repo is clean on dev.`
- `Not yet done in a milestone-owned way: a focused end-to-end validation of the core learner loop after all foundation work.`

## Blockers And Risks
- `The platform foundation is ahead of actual learner-loop depth.`
- `Recurring mistake memory, structured coaching output, scenario-aware coaching, retry UX, and review surfaces still need hardening.`
- `Main risk: building too much speech/platform complexity before the learning loop is truly useful.`

## Decisions And Assumptions
- `shared LAN/server-based product`
- `AI heavy lifting is server-side`
- `Postgres is the durable persistence target`
- `Apple clients are native front ends`
- `web app/backend foundation already exists`
- `speech transcription plumbing already exists`
- `speech should remain thin and integrated, not become a separate giant subsystem`
- `v1 remains correction/roleplay/listening-focused, not overbuilt speech infrastructure`

## Next Recommended Action
- `Own the milestone CORE LEARNING LOOP + THIN SPEECH INTEGRATION V1 and make the app's actual learner loop materially better.`

==================================================
PROJECT PURPOSE
==================================================

A practical Spanish-learning system and local-first coaching app for an American couple preparing to live in Costa Rica in about 3 years, with emphasis on:
- real conversation
- listening comprehension of natural/local speech
- Costa Rica-specific scenarios
- correction and coaching
- roleplay
- shared household use across devices
- Apple native clients + shared LAN/server backend

==================================================
THIS MILESTONE
==================================================

`CORE LEARNING LOOP + THIN SPEECH INTEGRATION V1`

This is the highest-priority product milestone now.

The goal is to turn the existing scaffold into a real usable learning loop where a learner can:
1. choose learner and scenario
2. speak or type a response in Spanish
3. receive structured coaching feedback
4. retry immediately
5. save recurring mistakes
6. review mistakes later
7. see visible progress

Important product principle:
Speech is NOT a separate standalone subsystem. Speech is just another input path into the structured coaching engine.
Do not build a giant real-time voice system. Do not chase advanced pronunciation scoring. Keep speech practical and thin.

The web app should be the reference implementation for this milestone.
The Apple client should be integrated only as far as necessary to stay aligned with the structured coaching contract and retry/review loop.

==================================================
PRIMARY OBJECTIVES
==================================================

1. Define and implement a structured coaching response schema
2. Add real mistake/error tagging and persistence
3. Connect coaching to scenarios and learner context
4. Support speech input as a first-class path into the same loop
5. Add retry-friendly UX and review surfaces
6. Keep the system beginner-safe and motivating

==================================================
REQUIRED DELIVERABLES
==================================================

A. STRUCTURED COACHING CONTRACT

Create or update a shared schema/type for coaching responses used consistently across:
- prompts
- coach engine
- API route(s)
- web UI
- Apple client integration points if applicable

The coaching response should distinguish between:
- transcript/input
- corrected Spanish
- more natural Spanish
- concise explanation
- error tags
- retry prompt
- follow-up prompt/question
- vocab notes
- pronunciation hints (lightweight only)
- confidence/feedback mode metadata

Suggested shape (adjust as needed, but keep it clean and explicit):

```json
{
  "input_mode": "text" | "speech",
  "transcript_text": "...",
  "corrected_text": "...",
  "natural_text": "...",
  "explanation_summary": "...",
  "error_tags": [
    {
      "code": "VERB_CONJUGATION",
      "severity": "primary" | "secondary",
      "message": "..."
    }
  ],
  "retry_prompt": "...",
  "follow_up_prompt": "...",
  "vocab_notes": [
    {
      "term": "...",
      "gloss": "...",
      "note": "..."
    }
  ],
  "pronunciation_hints": [
    {
      "term": "...",
      "hint": "..."
    }
  ],
  "feedback_mode": "gentle" | "standard" | "detailed" | "strict",
  "learner_focus": "beginner" | "survival" | "naturalization",
  "scenario_id": "...",
  "session_id": "...",
  "review_recommendation": {
    "should_review": true,
    "reason": "..."
  }
}
```

Keep it structured and machine-usable. Do not return only freeform prose.

B. ERROR TAXONOMY + MISTAKE MEMORY

Add or formalize a controlled error taxonomy. Start with a practical v1 set such as:
- SER_ESTAR
- VERB_CONJUGATION
- TENSE_SELECTION
- ARTICLE_MISSING
- GENDER_AGREEMENT
- NUMBER_AGREEMENT
- PREPOSITION
- WORD_ORDER
- INFINITIVE_MISUSE
- LITERAL_TRANSLATION
- VOCAB_CHOICE
- REGISTER_MISMATCH
- LISTENING_MISHEAR
- PRONUNCIATION_LIKELY
- CLARITY_REPAIR_NEEDED

Requirements:
- errors should be taggable and persistable
- sessions should store recurring issues
- learner review history should be queryable later
- enable "review my recent mistakes" in a simple v1 form

If schema/storage changes are needed, make them cleanly and document them.

C. THIN SPEECH INTEGRATION V1

Use existing speech transcription plumbing and wire it into the same coaching loop as text.

Required flow:
1. user records audio
2. backend transcribes audio
3. transcript goes into coaching engine
4. structured coaching response returns
5. UI shows:
   - transcript
   - correction
   - natural version
   - concise explanation
   - retry prompt
   - pronunciation hints (lightweight)
6. user can retry

Do NOT build:
- streaming voice conversation
- advanced phoneme scoring
- accent classifier
- real-time latency optimizations
- complex audio infra beyond what this milestone needs

Pronunciation hints should remain lightweight and practical, for example:
- stress hints
- likely troublesome words
- simple syllable guidance
- "say this more naturally" notes

D. LEARNER-AWARE FEEDBACK BEHAVIOR

Incorporate learner-aware coaching behavior.

Assume two learner profiles:
- Learner A: true beginner, needs confidence-safe correction, visible wins, focus on biggest errors, practical speech
- Learner B: stronger survival Spanish, needs naturalization, smoother phrasing, listening stretch, realism

The system should support at least:
- feedback mode / strictness level
- learner-focus mode
- reduced overload for beginners
- stronger naturalization guidance for the more advanced learner

Do not hardcode to just these two people, but support this use case cleanly.

E. SCENARIO-LINKED LEARNING LOOP

Make the coaching loop scenario-aware.

At minimum, connect coaching sessions to scenario selection and persist scenario context in the session layer.

Use a small gold-standard set of high-value scenarios for this milestone, such as:
- grocery store
- cafe / ordering / paying
- neighbor small talk
- landlord / rental basics
- pharmacy or bank basics

For each, ensure the coaching engine can use scenario context when generating feedback and follow-up prompts.

F. RETRY + REVIEW UX

In web app and, where practical for this milestone, Apple client integration surfaces:
- make retry obvious
- show the user's original response
- show corrected response
- show natural response
- show minimal explanation first
- let the user try again

Add a simple v1 review surface or flow for:
- recent mistakes
- recurring tags
- next recommended retry/drill

Do not overdesign this. Keep it useful and simple.

==================================================
FILES / AREAS TO REVIEW AND UPDATE
==================================================

Prioritize work in or around these areas if they already exist:

Backend / server:
- `/Users/guyharris/learn-to-live-in-costa-rica/app/web/src/app/api/coach/route.ts`
- `/Users/guyharris/learn-to-live-in-costa-rica/app/web/src/app/api/speech/transcribe/route.ts`
- `/Users/guyharris/learn-to-live-in-costa-rica/app/web/src/app/api/sessions/route.ts`
- `/Users/guyharris/learn-to-live-in-costa-rica/app/web/src/lib/server/coach-engine.ts`
- `/Users/guyharris/learn-to-live-in-costa-rica/app/web/src/lib/server/session-store.ts`
- `/Users/guyharris/learn-to-live-in-costa-rica/app/web/src/lib/server/speech.ts`
- `/Users/guyharris/learn-to-live-in-costa-rica/app/web/src/lib/data/loaders.ts`

Web UI:
- `/Users/guyharris/learn-to-live-in-costa-rica/app/web/src/components/session-playground.tsx`
- `/Users/guyharris/learn-to-live-in-costa-rica/app/web/src/components/audio-capture.tsx`

Apple/native:
- integrate only as far as necessary to expose the new structured result and retry loop
- do not spend this milestone on visual polish unless needed for usability
- avoid scope creep into unrelated native refinements

Data / prompts / docs:
- `/Users/guyharris/learn-to-live-in-costa-rica/prompts`
- `/Users/guyharris/learn-to-live-in-costa-rica/data`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/product/app-spec.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/product/native-client.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/setup/local-dev.md`

If project truth changes, refresh the relevant handoff/status docs before closing the thread:
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/APP_STATUS.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/NEXT_ACTIONS.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/ROADMAP_STATUS.md`
- and any other changed status/handoff files that materially need updating

==================================================
PRODUCT RULES
==================================================

1. Bias toward shipping a useful v1 loop, not theoretical completeness.
2. Keep speech thin and integrated.
3. Keep feedback motivating for beginners.
4. Do not overwhelm the learner with too many corrections at once.
5. Prefer structured outputs over prose blobs.
6. Keep scenario context explicit.
7. Avoid more platform expansion unless directly needed.
8. Avoid overengineering.
9. Preserve clear public/private data boundaries.
10. Keep the design compatible with shared household use.

==================================================
SUCCESS CRITERIA
==================================================

This milestone is successful if, after implementation, a learner can do the following:

TEXT PATH
- choose a learner
- choose a scenario
- type a Spanish response
- get structured coaching feedback
- retry immediately
- have mistakes stored for later review

SPEECH PATH
- choose a learner
- choose a scenario
- record speech
- get transcript + structured coaching feedback
- retry immediately
- have mistakes stored for later review

REVIEW PATH
- inspect recent or recurring mistakes in a simple v1 way
- see enough structure that future drills/review generation is possible

==================================================
IMPLEMENTATION NOTES
==================================================

- If needed, introduce shared TypeScript types/interfaces for coaching/session/error data.
- If needed, introduce database/storage schema improvements in a disciplined way.
- If some pieces must remain mocked/fallback-based, do so honestly and document it clearly.
- Keep changes incremental and coherent.
- Favor clean seams for later Listening Lab and Couple Mode milestones.
- Start with a short milestone plan for this thread only, then execute the work.
- Use subagents aggressively for bounded discovery, verification, and parallel reading where helpful.
- Within the first working pass, explicitly identify the critical-path work that stays local and the sidecar tasks that should be delegated.

==================================================
OUTPUT FORMAT
==================================================

Please proceed without asking clarifying questions unless absolutely blocked.

After implementing, provide:

1. A concise summary of what changed
2. The key files touched
3. Any schema/storage changes made
4. Any assumptions or temporary limitations
5. The next 5 recommended tasks after this milestone
6. A short note on how this milestone sets up:
   - Listening Lab v1
   - Couple Mode v1
   - Costa Rica Scenario Pack expansion

Please start now and make sensible decisions biased toward simplicity, structure, and a genuinely useful learner experience.
