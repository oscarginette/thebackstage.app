# Backstage Skills

This directory contains Claude Code skills for the Backstage project.

## Available Skills

### 📊 database-schema

**Purpose:** Quick reference for database table names, columns, and conventions.

**Use when:**
- Writing SQL queries and need exact table/column names
- Checking multi-tenant filtering requirements
- Understanding relationships between tables
- Following project naming conventions
- Planning database migrations

**Files:**
- `database-schema.md` - Main documentation with conventions and business rules
- `database-schema-auto.md` - Auto-generated table structures

**How to use:**
```bash
# Invoke the skill in Claude Code
/skill database-schema

# Or just reference it naturally:
"What's the exact table name for email templates?"
"Show me the contacts table structure"
"What columns does the users table have?"
```

**Auto-sync:**
Run this command after any database migration to update the schema:

```bash
npm run db:sync-schema
```

This will:
1. Connect to the database
2. Fetch all table structures
3. Update `database-schema-auto.md` with current schema
4. Update timestamps in `database-schema.md`

---

## Future Skills (Ideas)

### 🛣️ api-routes
- List all API routes with methods
- Request/response schemas
- Authentication requirements

### 🧪 testing-patterns
- Unit test templates
- Integration test setup
- Mocking patterns

### 🎨 ui-components
- Component library reference
- Props documentation
- Design system tokens

### 📧 email-templates
- Available templates
- Variable substitution syntax
- MJML guidelines

---

**Maintained by:** Development Team
**Last updated:** 2025-12-22
