#!/usr/bin/env sh

# This script checks if staged files include DB schema changes.
# If changes are detected, it increments the DB_VERSION in
# web-app/src/models/db/index.ts and stages the change.

# Ensure script runs relative to the git root directory
cd "$(git rev-parse --show-toplevel)" || exit 1

# --- Configuration ---
SCHEMA_FILES=(
  "web-app/src/models/db/index.ts"
  "web-app/src/models/db/addCustomIndexes.ts"
  "web-app/src/api/schema.ts"
)
DB_INDEX_FILE="web-app/src/models/db/index.ts"
# --- End Configuration ---

SCHEMA_CHANGED=false

echo "Checking for staged DB schema changes..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only)

# Check if any schema file is staged
for schema_file in "${SCHEMA_FILES[@]}"; do
  # Use grep -q for quiet mode, -x for exact match, -F for fixed string
  if echo "$STAGED_FILES" | grep -qxF "$schema_file"; then
    echo "Detected staged change in schema file: $schema_file"
    SCHEMA_CHANGED=true
    break
  fi
done

# If schema changed, increment DB_VERSION and stage the change
if [ "$SCHEMA_CHANGED" = true ]; then
  echo "Incrementing DB_VERSION in $DB_INDEX_FILE..."
  # Use awk to find the line, increment the version number, and overwrite the file
  # Ensure awk handles potential comments correctly
  awk '
  /^[[:space:]]*export[[:space:]]+const[[:space:]]+DB_VERSION[[:space:]]*=[[:space:]]*/ {
    # Match the line, capture prefix, number, and suffix
    match($0, /^(.*=[[:space:]]*)([0-9]+)(.*)$/, arr)
    if (arr[2]) {
      print arr[1] (arr[2] + 1) arr[3]; # Print line with incremented version
    } else {
      print $0; # Print unchanged if regex fails unexpectedly
    }
    next; # Skip default printing for this line
  }
  { print } # Print all other lines unchanged
  ' "$DB_INDEX_FILE" > temp_db_index.ts && mv temp_db_index.ts "$DB_INDEX_FILE"

  if [ $? -eq 0 ]; then
    current_version=$(grep 'export const DB_VERSION =' "$DB_INDEX_FILE" | awk '{print $NF}')
    echo "Successfully updated DB_VERSION to $current_version in $DB_INDEX_FILE."
    echo "Staging updated $DB_INDEX_FILE..."
    git add "$DB_INDEX_FILE"
    if [ $? -ne 0 ]; then
        echo "Error staging $DB_INDEX_FILE. Aborting." >&2
        exit 1
    fi
  else
    echo "Error updating $DB_INDEX_FILE. Aborting." >&2
    rm -f temp_db_index.ts # Clean up temp file on error
    exit 1
  fi
else
  echo "No relevant schema changes detected."
fi

exit 0
