# Decision Log

Last updated: 2026-03-22

## Confirmed Decisions

### Architecture

- The app is now a shared local-network system, not a purely browser-local tool.
- The backend is the source of truth for learner state, scenario catalogs, sessions, and speech processing.
- Postgres is the durable persistence target.
- AI heavy lifting belongs on the server, not on-device, for the current product shape.
- Web and native clients should share one backend contract.

### Product Direction

- V1 remains text-first at its core.
- Speech matters, but it should feed the existing correction flow rather than redefine the product.
- The shared coaching contract should stay structured and machine-usable across backend, web, and native clients.
- Retry prompts, typed error tags, and review recommendations are now part of the canonical learner loop, not optional extras.
- Scenario branches, couple handoff metadata, and listening references should be captured in the same shared contract rather than split into separate feature-specific formats.
- The correction UX and scenario usefulness matter more than advanced speech infrastructure right now.
- The project should stay focused on real-life fluency for Costa Rica rather than academic-only Spanish.

### Apple Client Direction

- The Apple client is an official product surface, not just an experiment.
- Mac should use the native macOS target.
- iPhone and iPad should use the iOS target.
- `My Mac (Designed for iPad)` is not the intended Mac path.
- Automatic signing should be enabled for Apple targets.
- Direct Xcode installs onto household devices come before more advanced distribution.

### Repo And Privacy

- The repo can remain public for code, prompts, templates, and generic learning assets.
- Sensitive learner data, private notes, personal transcripts, and household-specific details should remain local/private.
- Public reusable assets should stay machine-readable where practical.

### Working Norms

- Keep prompts modular.
- Avoid overengineering.
- Use boring, maintainable tools when possible.
- Keep `gh auth` commands outside the sandbox/elevated when sandbox auth behaves unreliably.

## Deferred Decisions

- Exact scope of v1.5 / v2 speech features
- Any move toward a fully offline or fully on-device AI path
- Whether/when to adopt ad hoc/TestFlight-like household distribution beyond direct Xcode installs
- Whether listening lab should become a product milestone before or after couple mode is stronger

## Open Decisions

- What should the next main emphasis be:
  - content/scenario depth
  - product feature depth
  - listening/speaking workflow depth
- How much effort should go into speech experiments before scenario engine and couple mode are more complete?
- When should the Apple client move from direct Xcode install support to more formal archive/export distribution?
- What is the best weekly operating rhythm between Codex implementation and ChatGPT project planning/tracking?
