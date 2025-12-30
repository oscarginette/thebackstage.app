# Domain Entities Auto-Documentation System

## Overview

This system automatically generates and maintains up-to-date documentation for all domain entities in the `domain-entities` Claude Code skill. It ensures that Claude always has accurate information about entity structure, fields, types, and methods.

## Features

✅ **Auto-generated Documentation**: Scans all `domain/entities/*.ts` files and extracts structure
✅ **Automatic Updates**: Post-edit hook regenerates docs when entities are modified
✅ **Validation**: CI/CD-ready script to ensure docs are synchronized
✅ **Type-Safe**: Extracts exact TypeScript types, interfaces, and signatures
✅ **Comprehensive**: Includes fields, factory methods, business methods, and types

---

## File Structure

```
.claude/
├── skills/
│   ├── domain-entities.md         # Auto-generated skill (DO NOT EDIT MANUALLY)
│   └── README-ENTITIES.md          # This file
└── hooks/
    └── post-edit.sh                # Auto-regenerates docs on entity edits

scripts/
├── update-entity-docs.ts           # Generator script
└── validate-entity-docs.ts         # Validation script (for CI/CD)

domain/entities/
└── *.ts                            # Source of truth
```

---

## Usage

### Manual Regeneration

```bash
npm run docs:entities
```

This scans all entity files and regenerates `.claude/skills/domain-entities.md`.

### Validation (CI/CD)

```bash
npm run docs:validate
```

**Exit codes:**
- `0`: Documentation is up-to-date ✅
- `1`: Documentation is outdated (needs regeneration) ❌
- `2`: Documentation file doesn't exist ❌

### Automatic Updates

The post-edit hook (`.claude/hooks/post-edit.sh`) automatically runs when you edit any file in `domain/entities/`. You don't need to do anything manually.

---

## How It Works

### 1. Entity Parsing

The script extracts:

**Types:**
```typescript
export type UserRole = 'artist' | 'admin';
```

**Interfaces/Props:**
```typescript
export interface UserProps {
  id: number;
  email: string;
  // ... more fields
}
```

**Factory Methods:**
```typescript
static async createNew(email: string, password: string): Promise<User>
```

**Business Methods:**
```typescript
async verifyPassword(password: string): Promise<boolean>
```

### 2. Documentation Generation

Generates structured markdown with:
- Table of contents
- Entity sections with location references
- Type definitions
- Field tables (name, type, optional, description)
- Method signatures with JSDoc descriptions
- Usage guide and best practices

### 3. Skill Integration

Claude Code can invoke the skill:

```
skill: domain-entities
```

This loads the complete, up-to-date entity reference into context.

---

## Example Output

```markdown
## User

**Location**: `domain/entities/User.ts`

### Types

```typescript
export type UserRole = 'artist' | 'admin'
```

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `number` |  |  |
| `email` | `string` |  |  |
| `role` | `UserRole` |  |  |
...
```

---

## Benefits for Claude Code

### 1. Consistency
- Always use correct field names (e.g., `emailsSentThisMonth` not `emailsSent`)
- Never forget optional fields (e.g., `subscriptionStartedAt?`)
- Use exact types from source code

### 2. Reduced Errors
- No typos in field names when writing repositories
- No missed fields when creating migrations
- Type-safe code generation

### 3. Faster Development
- Quick reference without reading entity files
- Factory methods at a glance
- Business logic methods documented

### 4. Onboarding
- New developers (human or AI) can quickly understand domain model
- Complete entity structure in one place
- Best practices included

---

## Workflow

### When You Edit an Entity

1. **Edit**: Modify `domain/entities/User.ts`
2. **Hook Triggers**: `.claude/hooks/post-edit.sh` detects entity change
3. **Regenerate**: Runs `npm run docs:entities` automatically
4. **Updated**: `.claude/skills/domain-entities.md` is refreshed
5. **Claude Knows**: Next time Claude uses the skill, it has latest structure

### In CI/CD Pipeline

Add to your CI workflow:

```yaml
# .github/workflows/ci.yml
- name: Validate entity documentation
  run: npm run docs:validate
```

This ensures no one commits entity changes without updating docs.

---

## Best Practices

### ✅ DO

- Run `npm run docs:entities` after creating a new entity
- Use the skill when working with repositories or migrations
- Keep entity JSDoc comments up-to-date (they appear in docs)
- Commit the generated `domain-entities.md` file

### ❌ DON'T

- Don't edit `domain-entities.md` manually (it's auto-generated)
- Don't skip documenting factory methods with JSDoc
- Don't forget to run `docs:validate` before committing major changes
- Don't rely on outdated memory—always check the skill

---

## Troubleshooting

### Documentation Not Updating

**Symptom**: Modified entity but skill shows old structure

**Fix**:
```bash
npm run docs:entities
```

### Hook Not Triggering

**Symptom**: Post-edit hook doesn't run

**Fix**:
```bash
chmod +x .claude/hooks/post-edit.sh
```

### Validation Failing in CI

**Symptom**: `npm run docs:validate` exits with code 1

**Fix**:
```bash
npm run docs:entities
git add .claude/skills/domain-entities.md
git commit -m "docs: update entity documentation"
```

---

## Advanced Usage

### Custom Entity Descriptions

Add JSDoc to factory methods:

```typescript
/**
 * Create new User entity with hashed password
 * Used when registering new users
 */
static async createNew(email: string, password: string): Promise<User>
```

This description will appear in the generated documentation.

### Excluding Entities

If you have experimental entities you don't want documented, move them to a different directory (e.g., `domain/entities/experimental/`). The script only scans `domain/entities/*.ts`.

---

## Technical Details

### Parser Logic

The script uses regex patterns to extract:
- Type definitions: `/export type (\w+) = ([^;]+);/g`
- Interface props: `/export interface ${fileName}Props\s*{([^}]+)}/s`
- Static methods: `/static\s+(?:async\s+)?(\w+)\s*\([^)]*\):\s*([^{]+)/g`
- Public methods: `/^\s+(?:async\s+)?(\w+)\s*\([^)]*\):\s*[^{]+/gm`

### Normalization

For validation, timestamps are removed to compare actual content:

```typescript
const normalizeContent = (content: string) => {
  return content
    .split('\n')
    .filter(line => !line.includes('**Auto-generated**:'))
    .filter(line => !line.includes('*Last updated:'))
    .join('\n');
};
```

---

## Maintenance

### Updating the Generator

If you need to modify the documentation format:

1. Edit `scripts/update-entity-docs.ts`
2. Run `npm run docs:entities` to test
3. Verify output in `.claude/skills/domain-entities.md`
4. Commit both the script and updated docs

### Adding New Sections

To add new sections to the generated docs (e.g., "Validation Rules"), edit the `generateDocumentation()` function in `update-entity-docs.ts`.

---

## Future Enhancements

Potential improvements:

- [ ] Extract validation rules from entity `validate()` methods
- [ ] Generate PlantUML diagrams for entity relationships
- [ ] Auto-detect repository interfaces that use each entity
- [ ] Generate TypeScript type definitions for database schemas
- [ ] Add entity change history (git-based)
- [ ] Generate migration suggestions when fields are added/removed

---

## Questions?

- **How does Claude access this?**: Using `skill: domain-entities` in conversation
- **Is this safe?**: Yes, it only reads TypeScript files (no execution)
- **Performance impact?**: Minimal (runs in <2 seconds for 20+ entities)
- **Can I disable it?**: Yes, delete `.claude/hooks/post-edit.sh`

---

**Last Updated**: 2025-12-30
**Version**: 1.0.0
**Maintainer**: Auto-generated system (SuperClaude)
