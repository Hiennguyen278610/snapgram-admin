#!/usr/bin/env bash
# DEV ONLY — seed reports vào content DB
# Đổi default DB_USER thành "snapgram": role "postgres" KHÔNG tồn tại trong
# container snapgram-postgres-content (đã verify 2026-10-08).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/dev-seed-reports.sql"

CONTAINER="${POSTGRES_CONTENT_CONTAINER:-snapgram-postgres-content}"
DB_USER="${POSTGRES_USER:-snapgram}"
DB_NAME="${POSTGRES_DB:-snapgram}"

echo "Seeding reports into $CONTAINER / $DB_NAME ..."
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$SQL_FILE"
echo "Done. Verify:"
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
  "SELECT status, COUNT(*) FROM content_reports GROUP BY status ORDER BY status;"
