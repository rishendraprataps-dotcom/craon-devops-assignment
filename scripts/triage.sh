#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${1:-sample/access.log}"

if [[ ! -f "$LOG_FILE" ]]; then
  echo "Error: Log file $LOG_FILE not found."
  exit 1
fi

echo "=== 1. TOP 5 ENDPOINTS ==="
awk '{print $7}' "$LOG_FILE" | sort | uniq -c | sort -rn | head -n 5

echo -e "\n=== 2. 5xx RESPONSES PER MINUTE ==="
grep -E '" 5[0-9]{2} ' "$LOG_FILE" | awk '{print $4}' | cut -d: -f1,2,3 | tr -d '[' | sort | uniq -c || echo "0 5xx errors found"

echo -e "\n=== 3. TOP 10 SLOWEST REQUESTS (ms) ==="
awk '{print $NF, $6, $7, $9}' "$LOG_FILE" | tr -d '"' | sort -rn | head -n 10
