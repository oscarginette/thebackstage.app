#!/bin/bash

# Script to apply Brevo integration migration
# Usage: ./scripts/migrate-brevo-integration.sh

set -e

echo "🔧 Applying Brevo Integration Migration..."
echo ""

# Check if PostgreSQL is accessible
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Extract database connection details from .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found"
    exit 1
fi

DB_URL=$(grep "^POSTGRES_URL=" .env.local | cut -d '=' -f 2-)

if [ -z "$DB_URL" ]; then
    echo "❌ Error: POSTGRES_URL not found in .env.local"
    exit 1
fi

echo "📊 Database: $DB_URL"
echo ""

# Apply migration
echo "⏳ Applying migration..."
psql "$DB_URL" -f sql/migration-brevo-integration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📋 Tables created:"
    echo "  • brevo_integrations"
    echo "  • brevo_import_history"
    echo ""
    echo "🔍 Columns added to contacts table:"
    echo "  • brevo_id (VARCHAR)"
    echo "  • brevo_list_ids (INTEGER[])"
    echo ""
    echo "👉 Next steps:"
    echo "  1. Start your dev server: npm run dev"
    echo "  2. Go to Settings page"
    echo "  3. Connect your Brevo account"
    echo "  4. Import your contacts!"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
