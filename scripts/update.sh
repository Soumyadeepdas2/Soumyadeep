#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# One-command update for soumyadeep.space
#
#   bash scripts/update.sh "what changed"
#
# Does three things, in the right order:
#   1. commits your new files (whatever you copied from the latest zip)
#   2. takes the stats bot's fresh practice.json if it committed meanwhile
#      (any clash is auto-settled in the bot's favour - that file is its job)
#   3. pushes, retrying if the bot commits at the same moment
#
# Safe to run any number of times. If something unexpected happens it
# stops WITHOUT pushing and nothing is lost.
# ---------------------------------------------------------------------------
set -euo pipefail

MSG="${1:-site update}"
cd "$(git rev-parse --show-toplevel)"

# 1. Commit local changes (skip cleanly if there are none)
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "$MSG"
  echo "Committed: $MSG"
else
  echo "Nothing new to commit - just syncing with the bot."
fi

# 2. Fetch the bot's commits; auto-keep ITS practice.json on any clash
git fetch origin main
if ! git rebase -X ours origin/main; then
  git rebase --abort || true
  echo
  echo "HALTED: unexpected problem while syncing (nothing was pushed or lost)."
  echo "Keep this window open and send a screenshot of it."
  exit 1
fi
echo "Synced with GitHub."

# 3. Push (retry a few times if the bot races us)
for attempt in 1 2 3; do
  if git push -q origin HEAD:main; then
    echo
    echo "DONE - pushed. Vercel will deploy it in about a minute."
    exit 0
  fi
  echo "Push raced with the bot (attempt $attempt/3) - resyncing..."
  git fetch -q origin main
  git rebase -X ours origin/main
done

echo "The bot keeps writing right now - wait a minute and run this again."
exit 1
