# Repo Workflow

## Branching

- `main` is the stable branch
- `dev` is the integration branch
- feature branches should be short-lived and focused

Suggested feature branch names:

- `feat/repo-bootstrap`
- `feat/text-coach-v1`
- `feat/scenario-engine`
- `feat/couple-mode`
- `feat/audio-prototype`
- `feat/backend-postgres`
- `feat/native-client-exploration`
- `feat/native-client-swiftui`

## Pull Request Expectations

- keep PRs focused
- update docs when behavior changes
- include screenshots for UI changes
- call out data-shape changes explicitly
- call out backend and persistence changes explicitly when they affect shared sessions or local-network behavior
- call out any API contract changes that affect both the web client and the native Apple client

## GitHub CLI Auth

- run `gh auth` commands with elevated permissions outside the sandbox
- if `gh auth status` fails in the sandbox, retry outside the sandbox before assuming login is broken
- prefer fixing auth visibility first, then continue with repo creation, pushes, PRs, or other GitHub CLI flows

## Review Checklist

- does the change improve conversation ability?
- does it support Costa Rica daily-life scenarios?
- is it necessary for v1?
- does it keep private data separate from public assets?
- is the implementation simpler than the next obvious alternative?
- does it preserve the text-first workflow even if speech is added later?
- does it keep the native Apple client and the web client aligned on the same backend contract?
