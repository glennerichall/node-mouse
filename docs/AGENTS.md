# Documentation guidance for agents

Keep documentation discoverable without making every task load every source.

- Start at [project documentation](project/README.md) to locate canonical
  project records; do not read every linked file by default.
- For implementation, open the one owning axis and its active item. Consult
  global vision/roadmap only when the task involves product direction or
  cross-axis priority.
- Find prior decisions with `rg` using an iteration ID, filename, or technical
  topic. Read only the matching journal(s); the latest journal overall is not
  necessarily relevant.
- `axes/` owns current tasks, checkboxes, and acceptance criteria;
  `development/` contains immutable records of completed work; `VISION.md`
  records durable product intent; `ROADMAP.md` orders axes.
- Add a dated journal only when an iteration is completed. Keep it concise and
  record decisions that would otherwise need rediscovery. Do not duplicate the
  task plan in the global roadmap or journal.
- Preserve the language and conventions of the document being edited. Keep
  links relative and verify changed links.
- Documentation-only changes do not bump the package version; follow the
  [project SemVer policy](project/VERSIONING.md) for mixed or release work.
