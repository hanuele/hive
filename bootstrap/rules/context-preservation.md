# Context Preservation

When working on long tasks or Hive missions:

1. Write reasoning to disk (blackboard, plan file, or session log) before
   it can be lost to context contraction
2. After context compaction occurs, re-read key files before continuing:
   - Commander's Intent (blackboard)
   - Current State section (blackboard)
   - Your most recent trace file (if any)
3. Never rely on conversation memory for decisions — if it matters, it
   should be on the blackboard
4. The "## Current State" section of any blackboard is writable by any
   agent at any time — use it as working memory
