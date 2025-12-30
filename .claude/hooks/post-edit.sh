#!/bin/bash
# Post-edit hook for Claude Code
# Auto-regenerates domain-entities skill when entity files are modified

# Check if the edited file is a domain entity
if [[ "$FILEPATH" =~ domain/entities/.*\.ts$ ]]; then
  echo "🔄 Entity file modified: $FILEPATH"
  echo "📝 Regenerating domain-entities documentation..."

  # Run the entity docs generator
  npm run docs:entities --silent

  if [ $? -eq 0 ]; then
    echo "✅ Domain entities documentation updated successfully"
  else
    echo "❌ Failed to update domain entities documentation"
    exit 1
  fi
fi
