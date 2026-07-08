#!/usr/bin/env bash
# =============================================================================
# The Hive — Bootstrap Integration Script
# =============================================================================
# Integrates the Hive multi-agent framework into an existing Claude Code project.
#
# Usage:
#   ./bootstrap.sh [OPTIONS]
#
# Options:
#   --target <path>   Target project root (default: git root of current dir)
#   --dry-run         Show what would be copied/appended without making changes
#   --force           Skip the Claude Code project check (CLAUDE.md / .claude/)
#   --help            Show this help message
#
# What it does:
#   1. Detects or accepts the target project root
#   2. Verifies it is a Claude Code project
#   3. Copies the Hive framework (incl. scripts/ and DOMAIN-INJECTION.md) into target/.claude/hive/
#   4. Copies bootstrap rules into target/.claude/rules/
#   5. Copies the assess-terrain skill into target/.claude/skills/
#   6. Copies the Hive agent definitions into target/.claude/agents/ (so squads can spawn them)
#   7. Appends the CLAUDE-SNIPPET.md to target CLAUDE.md (idempotent)
#   8. Self-verifies: counts remaining {PLACEHOLDER} tokens in the installed tree
#   9. Prints the DOMAIN-INJECTION-CHECKLIST.md so you know what to fill in
# =============================================================================

set -euo pipefail

# ---- Resolve script location ------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HIVE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ---- Defaults ---------------------------------------------------------------
TARGET=""
DRY_RUN=false
FORCE=false

# ---- Colors (only when running in a terminal) --------------------------------
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' BOLD='' RESET=''
fi

# ---- Helpers ----------------------------------------------------------------
info()    { echo -e "${CYAN}[hive]${RESET} $*"; }
success() { echo -e "${GREEN}[hive]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET} $*"; }
error()   { echo -e "${RED}[error]${RESET} $*" >&2; }
die()     { error "$*"; exit 1; }

copy_item() {
  local src="$1"
  local dst="$2"
  if [ "$DRY_RUN" = true ]; then
    info "[dry-run] Would copy: ${src} -> ${dst}"
  else
    if [ -d "$src" ]; then
      mkdir -p "$dst"
      cp -r "${src}/." "$dst/"
    else
      mkdir -p "$(dirname "$dst")"
      cp "$src" "$dst"
    fi
    success "Copied: $(basename "$src") -> ${dst#"$TARGET/"}"
  fi
}

# ---- Parse arguments --------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --help|-h)
      sed -n '3,25p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *)
      die "Unknown option: $1 (use --help for usage)"
      ;;
  esac
done

# ---- Step 1: Detect project root --------------------------------------------
echo ""
echo -e "${BOLD}The Hive — Bootstrap Integration${RESET}"
echo "=================================================="
echo ""

if [ -z "$TARGET" ]; then
  # Attempt to find git root of the current directory
  if git rev-parse --show-toplevel &>/dev/null; then
    TARGET="$(git rev-parse --show-toplevel)"
    info "Auto-detected project root: ${TARGET}"
  else
    die "Not inside a git repository. Use --target /path/to/project to specify the target."
  fi
else
  # Normalise the path
  TARGET="$(cd "$TARGET" && pwd)"
  info "Target project root: ${TARGET}"
fi

# Guard: don't bootstrap into the Hive repo itself
if [ "$TARGET" = "$HIVE_ROOT" ]; then
  die "Target cannot be the Hive repo itself (${HIVE_ROOT})."
fi

# ---- Step 2: Verify Claude Code project -------------------------------------
if [ "$FORCE" = false ]; then
  if [ ! -f "${TARGET}/CLAUDE.md" ] && [ ! -d "${TARGET}/.claude" ]; then
    die "No CLAUDE.md or .claude/ found in ${TARGET}.\nThis does not look like a Claude Code project.\nUse --force to skip this check."
  fi
  info "Claude Code project verified (CLAUDE.md or .claude/ present)."
fi

# ---- Step 3: Copy Hive framework --------------------------------------------
echo ""
info "Step 3/9 — Copying Hive framework..."

# NOTE: "scripts" is copied into .claude/hive/scripts/ so that persona/protocol references
# like "scripts/context-budget.sh" resolve relative to the hive root (.claude/hive/).
# Each dir copy below is guarded by an if-exists check, so a partial source tree only warns.
HIVE_DIRS=(
  "personas"
  "squads"
  "constitutions"
  "protocols"
  "terrain"
  "differentiation"
  "_verification"
  "memory"
  "scripts"
)
HIVE_FILES=(
  "integration-guide.md"
  "GLOSSARY.md"
  "DOMAIN-INJECTION.md"
)

DEST_HIVE="${TARGET}/.claude/hive"

if [ "$DRY_RUN" = false ]; then
  mkdir -p "$DEST_HIVE"
fi

for dir in "${HIVE_DIRS[@]}"; do
  src="${HIVE_ROOT}/${dir}"
  if [ -d "$src" ]; then
    copy_item "$src" "${DEST_HIVE}/${dir}"
  else
    warn "Skipping missing directory: ${dir}/"
  fi
done

for file in "${HIVE_FILES[@]}"; do
  src="${HIVE_ROOT}/docs/${file}"
  # Also check root level
  [ -f "$src" ] || src="${HIVE_ROOT}/${file}"
  if [ -f "$src" ]; then
    copy_item "$src" "${DEST_HIVE}/${file}"
  else
    warn "Skipping missing file: ${file}"
  fi
done

# ---- Step 4: Copy bootstrap rules -------------------------------------------
echo ""
info "Step 4/9 — Copying rules..."

DEST_RULES="${TARGET}/.claude/rules"
BOOTSTRAP_RULES="${HIVE_ROOT}/bootstrap/rules"

if [ -d "$BOOTSTRAP_RULES" ]; then
  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$DEST_RULES"
  fi
  for rule_file in "${BOOTSTRAP_RULES}"/*.md; do
    [ -f "$rule_file" ] || continue
    filename="$(basename "$rule_file")"
    dest_file="${DEST_RULES}/${filename}"
    if [ -f "$dest_file" ]; then
      warn "Rule already exists, skipping: ${filename} (delete it first to overwrite)"
    else
      copy_item "$rule_file" "$dest_file"
    fi
  done
else
  warn "No bootstrap/rules/ directory found — skipping."
fi

# ---- Step 5: Copy assess-terrain skill --------------------------------------
echo ""
info "Step 5/9 — Copying assess-terrain skill..."

DEST_SKILL="${TARGET}/.claude/skills/assess-terrain"
SRC_SKILL="${HIVE_ROOT}/bootstrap/skills/assess-terrain"

if [ -d "$SRC_SKILL" ]; then
  if [ -d "$DEST_SKILL" ]; then
    warn "Skill already exists at ${DEST_SKILL} — skipping (delete to overwrite)."
  else
    copy_item "$SRC_SKILL" "$DEST_SKILL"
  fi
else
  warn "bootstrap/skills/assess-terrain/ not found — skipping."
fi

# ---- Step 6: Copy Hive agent definitions into .claude/agents/ ---------------
echo ""
info "Step 6/9 — Installing Hive agents..."

# Agents live in .claude/agents/ (NOT .claude/hive/agents/) because that is where
# Claude Code discovers subagent definitions. Installing them here is what lets the
# squads actually spawn the named agents they reference.
SRC_AGENTS="${HIVE_ROOT}/agents"
DEST_AGENTS="${TARGET}/.claude/agents"

if [ -d "$SRC_AGENTS" ]; then
  agent_count=0
  for agent_file in "${SRC_AGENTS}"/*.md; do
    [ -f "$agent_file" ] || continue
    filename="$(basename "$agent_file")"
    # Only install real agent definitions: a Claude Code agent begins with a YAML
    # frontmatter block carrying a `name:` field. This skips docs like README.md that
    # would otherwise land in .claude/agents/ and confuse the agent loader.
    if [ "$(head -n 1 "$agent_file")" != "---" ] || ! grep -qE '^name:[[:space:]]' "$agent_file"; then
      info "Skipping non-agent file (no frontmatter): ${filename}"
      continue
    fi
    dest_file="${DEST_AGENTS}/${filename}"
    if [ -f "$dest_file" ]; then
      warn "Agent already exists, skipping: ${filename} (delete it first to overwrite)"
    else
      copy_item "$agent_file" "$dest_file"
      agent_count=$((agent_count + 1))
    fi
  done
  if [ "$DRY_RUN" = false ]; then
    info "Installed ${agent_count} Hive agent definition(s) into .claude/agents/ — squads can now spawn them as named background agents."
  fi
else
  warn "No agents/ directory found at ${SRC_AGENTS} — skipping (squads will have no agent definitions to spawn)."
fi

# ---- Step 7: Append CLAUDE-SNIPPET.md to CLAUDE.md -------------------------
echo ""
info "Step 7/9 — Updating CLAUDE.md..."

SNIPPET_FILE="${HIVE_ROOT}/bootstrap/CLAUDE-SNIPPET.md"
TARGET_CLAUDE="${TARGET}/CLAUDE.md"
HIVE_MARKER="## Hive Integration"

if [ ! -f "$SNIPPET_FILE" ]; then
  warn "CLAUDE-SNIPPET.md not found — skipping CLAUDE.md update."
elif ! [ -f "$TARGET_CLAUDE" ]; then
  warn "No CLAUDE.md found at ${TARGET_CLAUDE} — skipping append."
elif grep -qF "$HIVE_MARKER" "$TARGET_CLAUDE" 2>/dev/null; then
  info "CLAUDE.md already contains '${HIVE_MARKER}' — skipping (idempotent)."
else
  if [ "$DRY_RUN" = true ]; then
    info "[dry-run] Would append CLAUDE-SNIPPET.md to ${TARGET_CLAUDE}"
  else
    {
      echo ""
      echo "---"
      echo "<!-- The Hive integration — auto-appended by bootstrap.sh -->"
      # Strip the header comment lines from the snippet (lines 1-3)
      tail -n +4 "$SNIPPET_FILE"
    } >> "$TARGET_CLAUDE"
    success "Appended Hive integration snippet to CLAUDE.md"
  fi
fi

# ---- Step 8: Self-verify — count remaining placeholders ---------------------
echo ""
info "Step 8/9 — Verifying placeholders..."

if [ "$DRY_RUN" = true ]; then
  info "[dry-run] Would count {PLACEHOLDER} tokens in the installed tree."
else
  # Count remaining {UPPER_SNAKE} tokens across the installed docs. Restricted to *.md so
  # the copied shell scripts (whose ${VAR} references also look like {TOKEN}) don't inflate
  # the count. A few framework runtime tokens ({NNN}, {N}, {MISSION}, …) still match and are
  # meant to stay — the checklist's "Runtime tokens" table lists them. This is a nudge toward
  # the checklist, not a hard gate.
  placeholder_count=$(grep -rhoE --include='*.md' '\{[A-Z_]+\}' \
    "${DEST_HIVE}" \
    "${TARGET}/.claude/rules" \
    "${TARGET}/.claude/skills/assess-terrain" \
    2>/dev/null | sort -u | wc -l | tr -d ' ')
  if [ "${placeholder_count:-0}" -gt 0 ]; then
    warn "${placeholder_count} distinct {PLACEHOLDER} token(s) await your values — see DOMAIN-INJECTION-CHECKLIST.md (Required, Optional, and Integration-layer tables). Runtime tokens listed there are expected to remain."
  else
    success "No {PLACEHOLDER} tokens found in the installed tree."
  fi
fi

# ---- Step 9: Print domain injection checklist --------------------------------
echo ""
info "Step 9/9 — Domain injection checklist"
echo ""

CHECKLIST="${HIVE_ROOT}/bootstrap/DOMAIN-INJECTION-CHECKLIST.md"
if [ -f "$CHECKLIST" ]; then
  echo -e "${BOLD}========================================${RESET}"
  echo -e "${BOLD} ACTION REQUIRED: Fill in placeholders  ${RESET}"
  echo -e "${BOLD}========================================${RESET}"
  echo ""
  cat "$CHECKLIST"
else
  warn "DOMAIN-INJECTION-CHECKLIST.md not found."
fi

# ---- Summary ----------------------------------------------------------------
echo ""
echo -e "${BOLD}========================================${RESET}"
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Dry run complete — no files were modified.${RESET}"
  echo "Run without --dry-run to apply the changes."
else
  echo -e "${GREEN}Bootstrap complete!${RESET}"
  echo ""
  echo "Next steps:"
  echo "  1. Fill in all {PLACEHOLDER} values (see checklist above)"
  echo "  2. Review ${TARGET}/.claude/hive/integration-guide.md"
  echo "  3. Run /assess-terrain on a real ticket to verify the skill"
fi
echo -e "${BOLD}========================================${RESET}"
echo ""
