# Agent entry point

Use progressive disclosure: inspect the task and affected files first, then read
only the instructions and project documents relevant to that work.

- Project-wide conventions and architecture map: [project guide](docs/project/README.md).
- For a planned change, use its owning document in `docs/project/axes/` as the
  source of tasks and acceptance criteria. Add an item there before
  implementation when needed.
- Read [VISION.md](docs/project/VISION.md) when a change may alter product
  direction or a durable principle. Read [ROADMAP.md](docs/project/ROADMAP.md)
  when choosing or reprioritizing work across axes, not for every local fix.
- Search `docs/project/development/` by task ID or affected topic for relevant
  prior decisions. Do not load the journal index or unrelated history wholesale.
- Documentation-specific routing and maintenance rules: [docs/AGENTS.md](docs/AGENTS.md).
- Codex-specific notes: [.codex/AGENTS.md](.codex/AGENTS.md).

Before editing, inspect `git status` and preserve unrelated user changes. Run
the narrowest relevant checks, then broader checks when risk warrants them.
Never mark roadmap work complete before its acceptance criteria are verified.
