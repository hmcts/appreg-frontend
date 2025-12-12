#!/bin/bash

# Script to archive weight files for next Jenkins build
# Usage: ./scripts/archive-weight-files.sh [smoke|regression]

set -e  # Exit on error

WEIGHT_TYPE=$1

if [ -z "$WEIGHT_TYPE" ]; then
    echo "Error: Weight type not specified"
    echo "Usage: $0 [smoke|regression]"
    exit 1
fi

# Create pipeline directory
mkdir -p cypress/parallel/weights/pipeline

# Copy weight file to pipeline directory for archiving
WEIGHT_FILE="cypress/parallel/weights/${WEIGHT_TYPE}-parallel-weights.json"
PIPELINE_FILE="cypress/parallel/weights/pipeline/${WEIGHT_TYPE}-parallel-weights.json"

if [ -f "$WEIGHT_FILE" ]; then
    cp -f "$WEIGHT_FILE" "$PIPELINE_FILE"
    echo "✓ Archived ${WEIGHT_TYPE} weights to pipeline directory"
else
    echo "⚠ Weight file not found: $WEIGHT_FILE (normal for first run)"
fi
