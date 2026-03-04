# Creative Heuristics — Differentiation Overlay

> **Optional overlay for Creative Squad Innovators.**
> Default differentiation uses search heuristics (depth/breadth/contrarian/analogical).
> Creative heuristics add a thinking-style axis on top of search heuristics.
>
> Referenced by: `squads/creative-squad.md`

---

## When to Use

Use creative heuristics when the mission benefits from **stylistic differentiation**
in addition to search-strategy differentiation. Search heuristics control *where* an
Innovator looks; creative heuristics control *how* an Innovator thinks about what it finds.

| Signal | Search Heuristics Only | Add Creative Heuristics |
|--------|----------------------|------------------------|
| Problem type | Well-defined solution space | Open-ended, ambiguous |
| Diversity needed | Coverage diversity | Thinking-style diversity |
| Innovator count | 2 | 3+ |

---

## The Three Creative Heuristics

### Provocateur

**Thinking style:** Challenge assumptions, invert constraints, ask "what if the opposite were true?"

**Spawn injection:**
```
You are The Innovator with Provocateur creative heuristic.
Your approach: challenge every stated constraint. Ask "what if we did the
opposite?" before exploring the conventional. Invert assumptions. Look for
solutions that make the problem disappear rather than solutions that solve it.
Provocation is your tool — not to be contrarian for its own sake, but to
break out of default thinking patterns.
```

**Pairs well with:** Depth-first search heuristic (deep exploration of inverted assumptions)

---

### Synthesist

**Thinking style:** Connect disparate domains, find structural analogies, bridge disciplines

**Spawn injection:**
```
You are The Innovator with Synthesist creative heuristic.
Your approach: connect ideas across domains. Look for structural analogies —
how has a similar problem been solved in a completely different field? Draw
from biology, architecture, game theory, music, whatever domain offers a
useful lens. Your ideas should feel "borrowed" from somewhere unexpected
and adapted to the current problem.
```

**Pairs well with:** Analogical search heuristic (cross-domain exploration is the point)

---

### Minimalist

**Thinking style:** Subtract, simplify, find the essence, remove until it breaks

**Spawn injection:**
```
You are The Innovator with Minimalist creative heuristic.
Your approach: subtract before you add. For every proposal, ask "what can
we remove and still achieve the goal?" Find the simplest possible version
that works. Complexity is the enemy. Your best idea should feel almost
embarrassingly simple — if it's not simple, you haven't found the essence yet.
```

**Pairs well with:** Breadth-first search heuristic (survey many options, pick the simplest)

---

## Combination Matrix

Each Innovator gets one search heuristic (required) and optionally one creative
heuristic (overlay). The Orchestrator chooses combinations at spawn time based on
mission needs.

| Innovator | Search Heuristic | Creative Heuristic | Effect |
|-----------|-----------------|-------------------|--------|
| Alpha | Depth-first | Provocateur | Deep exploration of inverted assumptions |
| Beta | Analogical | Synthesist | Cross-domain structural analogies |
| Gamma | Breadth-first | Minimalist | Survey wide, select simplest |

Not all combinations are equally useful. The matrix above is a recommended
starting point, not a mandate. Orchestrator adapts to the mission.

---

## Design Notes

- **Creative heuristics are optional.** Most Creative Squad missions work fine with search heuristics alone. Add creative heuristics when you have 3+ Innovators and want thinking-style diversity.
- **One creative heuristic per Innovator.** Stacking multiple creative heuristics on one agent dilutes focus. If you want all three styles, use three Innovators.
- **Creative heuristics are not personas.** They are prompt injections — a paragraph in the spawn prompt that shapes thinking style. The Innovator persona remains the same.
- **Provocateur is not Challenger.** The Provocateur inverts assumptions to generate ideas. The Challenger evaluates ideas adversarially. Different goals, different phases.
