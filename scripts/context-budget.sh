#!/usr/bin/env bash
# context-budget.sh -- Context budget tracker (Protocol OS bridge)
#
# Reads context zone from Protocol OS session traces. One-directional:
# Hive reads Protocol OS state, Protocol OS doesn't know about Hive.
#
# Zone source: ~/.claude/traces/{session_id}.jsonl
#   event: "zone_transition", to_zone: "green"/"yellow"/"red"
#
# Subcommands:
#   init <agent> [--profile subagent|coordinator]
#   check <agent>
#   tick <agent> [--files-read <bytes>]
#   render <agent>
#   render-all
#   reset <agent>
#
# State files: C:/tmp/hive-budget-{session_id}-{agent}.state
# Requires: SESSION_ID env var or --session-id flag

set -euo pipefail

TRACES_DIR="$HOME/.claude/traces"
STATE_PREFIX="C:/tmp/hive-budget"

get_session_id() {
  if [ -n "${SESSION_ID:-}" ]; then
    echo "$SESSION_ID"
  else
    echo "ERROR: SESSION_ID not set. Export it or pass --session-id." >&2
    exit 1
  fi
}

state_file() {
  local agent="$1"
  local sid
  sid=$(get_session_id)
  echo "${STATE_PREFIX}-${sid}-${agent}.state"
}

read_zone_from_trace() {
  local sid
  sid=$(get_session_id)
  local trace="${TRACES_DIR}/${sid}.jsonl"
  if [ ! -f "$trace" ]; then
    echo "UNKNOWN"
    return
  fi
  local zone
  zone=$(tail -200 "$trace" \
    | grep '"event":"zone_transition"' \
    | tail -1 \
    | jq -r '.to_zone // "UNKNOWN"' 2>/dev/null)
  if [ -z "$zone" ] || [ "$zone" = "null" ]; then
    echo "UNKNOWN"
  else
    echo "$zone" | tr '[:lower:]' '[:upper:]'
  fi
}

cmd_init() {
  local agent="${1:?Usage: init <agent-name>}"
  shift
  local profile="subagent"
  while [ $# -gt 0 ]; do
    case "$1" in
      --profile) profile="${2:-subagent}"; shift 2 ;;
      *) shift ;;
    esac
  done
  local sf
  sf=$(state_file "$agent")
  local sid
  sid=$(get_session_id)
  cat > "$sf" <<EOF
agent=$agent
profile=$profile
zone=GREEN
ticks=0
bytes=0
last_check=$(date +%s)
session_id=$sid
EOF
  echo "Initialized budget tracker for $agent (profile: $profile)"
}

cmd_check() {
  local agent="${1:?Usage: check <agent-name>}"
  local zone
  zone=$(read_zone_from_trace)
  local sf
  sf=$(state_file "$agent")
  if [ -f "$sf" ]; then
    local old_zone
    old_zone=$(grep '^zone=' "$sf" | cut -d= -f2)
    sed -i "s/^zone=.*/zone=$zone/" "$sf"
    sed -i "s/^last_check=.*/last_check=$(date +%s)/" "$sf"
  fi
  echo "$zone"
}

cmd_tick() {
  local agent="${1:?Usage: tick <agent-name>}"
  shift
  local bytes_read=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --files-read) bytes_read="${2:-0}"; shift 2 ;;
      *) shift ;;
    esac
  done
  local sf
  sf=$(state_file "$agent")
  if [ ! -f "$sf" ]; then
    echo "ERROR: No state file for $agent. Run init first." >&2
    exit 1
  fi
  local old_zone
  old_zone=$(grep '^zone=' "$sf" | cut -d= -f2)
  local new_zone
  new_zone=$(read_zone_from_trace)
  local ticks
  ticks=$(grep '^ticks=' "$sf" | cut -d= -f2)
  ticks=$((ticks + 1))
  local total_bytes
  total_bytes=$(grep '^bytes=' "$sf" | cut -d= -f2)
  total_bytes=$((total_bytes + bytes_read))

  sed -i "s/^zone=.*/zone=$new_zone/" "$sf"
  sed -i "s/^ticks=.*/ticks=$ticks/" "$sf"
  sed -i "s/^bytes=.*/bytes=$total_bytes/" "$sf"
  sed -i "s/^last_check=.*/last_check=$(date +%s)/" "$sf"

  if [ "$old_zone" != "$new_zone" ]; then
    echo "ZONE_CHANGE: $old_zone -> $new_zone"
  fi
}

cmd_render() {
  local agent="${1:?Usage: render <agent-name>}"
  local sf
  sf=$(state_file "$agent")
  if [ ! -f "$sf" ]; then
    echo "[$agent] no state file"
    return
  fi
  local zone ticks last_check
  zone=$(grep '^zone=' "$sf" | cut -d= -f2)
  ticks=$(grep '^ticks=' "$sf" | cut -d= -f2)
  last_check=$(grep '^last_check=' "$sf" | cut -d= -f2)
  local since
  since=$(date -d "@$last_check" '+%H:%M' 2>/dev/null \
    || python3 -c "from datetime import datetime; print(datetime.fromtimestamp($last_check).strftime('%H:%M'))" 2>/dev/null \
    || echo "?")
  echo "[$agent] zone=$zone since=$since ticks=$ticks"
}

cmd_render_all() {
  local sid
  sid=$(get_session_id)
  local pattern="${STATE_PREFIX}-${sid}-*.state"
  local found=0
  for sf in $pattern; do
    [ ! -f "$sf" ] && continue
    found=1
    local agent
    agent=$(grep '^agent=' "$sf" | cut -d= -f2)
    cmd_render "$agent"
  done
  if [ "$found" -eq 0 ]; then
    echo "No tracked agents for session $sid"
  fi
}

cmd_reset() {
  local agent="${1:?Usage: reset <agent-name>}"
  local sf
  sf=$(state_file "$agent")
  rm -f "$sf"
  echo "Reset budget tracker for $agent"
}

subcmd="${1:-help}"
shift 2>/dev/null || true

case "$subcmd" in
  init)       cmd_init "$@" ;;
  check)      cmd_check "$@" ;;
  tick)       cmd_tick "$@" ;;
  render)     cmd_render "$@" ;;
  render-all) cmd_render_all ;;
  reset)      cmd_reset "$@" ;;
  help|*)
    echo "context-budget.sh — Protocol OS budget bridge"
    echo "Zone source: ~/.claude/traces/{SESSION_ID}.jsonl"
    echo ""
    echo "Subcommands:"
    echo "  init <agent> [--profile subagent]"
    echo "  check <agent>"
    echo "  tick <agent> [--files-read <bytes>]"
    echo "  render <agent>"
    echo "  render-all"
    echo "  reset <agent>"
    echo ""
    echo "Requires: SESSION_ID env var"
    ;;
esac
