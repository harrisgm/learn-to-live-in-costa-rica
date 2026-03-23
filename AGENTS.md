# AGENTS.md

## Project
Learn to Live in Costa Rica

## Mission
Build a practical Spanish-learning system and local-first coaching app for an American couple preparing to live in Costa Rica within about three years.

## Priorities
1. Real-world Spanish for living in Costa Rica
2. Listening comprehension of natural and fast speech
3. Speaking correction and confidence
4. Clean, maintainable repo structure
5. Fast delivery of a useful v1

## Users
- Primary user 1: true beginner in Spanish
- Primary user 2: basic survival Spanish, not yet fluent
- Both users want to read, write, speak, and understand locals at natural speed

## Product Constraints
- Prefer simple, local-first architecture
- Avoid overengineering
- Avoid premature mobile-first decisions
- Prefer shipping a useful text-first correction tool before advanced voice features
- Protect personal and private study data from entering the public repo

## Engineering Rules
- Keep docs clear and current
- Prefer boring, reliable tools
- Add concise comments only where useful
- Keep prompts modular under `/prompts`
- Keep data files structured and machine-readable when possible
- Separate generic curriculum assets from user-private learning data
- Run `gh auth` commands with elevated permissions outside the sandbox, because the GitHub keychain-backed login may appear invalid inside the sandbox even when host auth is healthy

## GitHub CLI Notes
- Treat `gh auth status`, `gh auth login`, `gh auth logout`, and similar auth-check commands as outside-sandbox operations
- If a sandboxed `gh auth` check looks broken, retry with elevated permissions before attempting any re-auth flow

## Stewardship
- Use [`docs/stewardship/STEWARD_THREAD_HANDBOOK.md`](docs/stewardship/STEWARD_THREAD_HANDBOOK.md) for steward-thread ownership, handoff timing, and delegation expectations
- Use [`docs/stewardship/HANDOFF_CHECKLIST.md`](docs/stewardship/HANDOFF_CHECKLIST.md) when closing a steward thread or handing off to a new one
- Use [`docs/chatgpt/README.md`](docs/chatgpt/README.md) as the source index for ChatGPT project uploads and thread setup
- For any non-trivial task, do an early delegation review before settling into single-threaded work
- If two or more bounded non-blocking tasks exist, spin up subagents early for discovery, verification, or disjoint implementation slices
- If no subagents are used, briefly state why the work is not meaningfully parallelizable

## When Adding Features
Always ask:
1. Does this directly improve conversation ability?
2. Does this help listening at real speed?
3. Is this useful for Costa Rica daily life?
4. Is this necessary for v1?

## Initial Milestones
- Bootstrap repo structure
- Create docs and data schemas
- Build text-based correction workflow
- Add scenario engine
- Add couple mode
- Add audio later
