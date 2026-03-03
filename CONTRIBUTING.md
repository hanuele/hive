# Contributing to The Hive

Thank you for your interest in contributing! The Hive is a living system — it
grows through the missions that test it and the people who use it.

## How to Contribute

### Report Issues

Found a bug, unclear documentation, or a protocol that doesn't work as
described? [Open an issue](https://github.com/hanuele/hive/issues) with:

- What you expected to happen
- What actually happened
- Which files are involved
- Your squad configuration (if applicable)

### Share Mission Results

The most valuable contributions are **real mission data**:

- Retrospectives that reveal new candidate patterns
- Error catalog entries for failure modes we haven't seen
- Observations about what works and what doesn't at scale

Open a PR adding your anonymized retrospective to `docs/community-missions/`
(create the directory if it doesn't exist yet).

### Propose Protocol Changes

Protocol changes follow the Crystallization Spiral:

1. **Observe** — document the pattern in a mission retrospective
2. **Pattern** — after 3+ observations across different missions, propose it
3. **Promote** — open a PR with the proposed rule change and evidence from
   3+ missions supporting it

Proposals without mission evidence are interesting but premature. Run the
missions first.

### Improve Documentation

Clarity is always welcome. If you read something and had to re-read it to
understand, that's a signal the writing can be improved. PRs for documentation
fixes don't need mission evidence — just clear writing.

### Add New Personas or Squads

The `_deferred/` directories contain squad stubs waiting to be developed. If
you've run missions that suggest a new squad type or persona, open a PR with:

- The persona or squad file following the existing format
- At least one retrospective showing the pattern in action
- Updates to `GLOSSARY.md` for any new terms

## Code of Conduct

The Hive's governance is rooted in the Thirteen Principles
(`constitutions/universal.md`). Contributors are expected to embody the same
values: humility, honest acknowledgment, care for the humans who will use this
work.

## Style Guide

- **Markdown files** — use ATX headers (`#`), one sentence per line where
  practical, and blank lines between sections
- **Persona narratives** — write in second person ("You are..."), present
  tense, narrative prose. Not bullet lists.
- **Protocols** — include a "When to use" section, a "Format" section, and
  an "Anti-pattern" example
- **Mermaid diagrams** — one diagram per file in `docs/diagrams/`, with a
  brief explanatory paragraph above the code block

## Development Setup

```bash
git clone https://github.com/hanuele/hive.git
cd hive
# No build step — The Hive is a framework of markdown files and one shell script
```

To test the bootstrap script:
```bash
mkdir /tmp/test-project && cd /tmp/test-project && git init
../hive/scripts/bootstrap.sh --target . --dry-run
```

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE).
