#!/bin/bash

# Script to copy weight artifacts from previous Jenkins builds
# This optimizes parallel test distribution by reusing execution time data

set -e  # Exit on error

# Create directory structure
mkdir -p cypress/parallel/weights/pipeline

# Move smoke weights if they exist
if [ -f cypress/parallel/weights/pipeline/smoke-parallel-weights.json ]; then
    mv cypress/parallel/weights/pipeline/smoke-parallel-weights.json cypress/parallel/weights/smoke-parallel-weights.json
    echo "✓ Moved smoke-parallel-weights.json"
fi

# Move regression weights if they exist
if [ -f cypress/parallel/weights/pipeline/regression-parallel-weights.json ]; then
    mv cypress/parallel/weights/pipeline/regression-parallel-weights.json cypress/parallel/weights/regression-parallel-weights.json
    echo "✓ Moved regression-parallel-weights.json"
fi
