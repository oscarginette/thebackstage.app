# ESLint Rules - Enforcement Guide

## 🎯 Goal

Automatic enforcement of code standards using ESLint.

---

## 📋 Recommended ESLint Rules

Add these to your `.eslintrc.json`:

```json
{
  "rules": {
    // Prevent string literals in comparisons
    "no-restricted-syntax": [
      "error",
      {
        "selector": "BinaryExpression[operator='==='][right.type='Literal'][right.value=/^(admin|artist|free|pro|business|unlimited|subscribe|unsubscribe)$/]",
        "message": "Use typed constants instead of string literals (e.g., USER_ROLES.ADMIN, SUBSCRIPTION_PLANS.FREE)"
      },
      {
        "selector": "BinaryExpression[operator='==='][left.type='Literal'][left.value=/^(admin|artist|free|pro|business|unlimited|subscribe|unsubscribe)$/]",
        "message": "Use typed constants instead of string literals"
      }
    ],

    // Enforce max function length
    "max-lines-per-function": ["warn", {
      "max": 30,
      "skipBlankLines": true,
      "skipComments": true
    }],

    // Enforce explicit error handling
    "no-catch-all": "off",  // Custom rule needed

    // Prevent magic numbers
    "no-magic-numbers": ["warn", {
      "ignore": [0, 1, -1],
      "ignoreArrayIndexes": true,
      "enforceConst": true
    }]
  }
}
```

---

## 🛠️ Custom ESLint Plugin (TODO)

Create a custom ESLint plugin to enforce:

1. **No business logic in API routes**
   - Detect SQL queries in `app/api/**/*.ts`
   - Detect direct `resend.emails.send()` calls
   - Enforce use of Use Cases

2. **Dependency Inversion**
   - Prevent importing from `infrastructure/` in `domain/`
   - Enforce interface usage in constructors

3. **String literal detection**
   - More sophisticated detection of domain literals
   - Auto-fix suggestions to use constants

---

## 📝 Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run ESLint
npm run lint

# Custom checks
echo "🔍 Checking for string literals..."
if git diff --cached --name-only | grep -E '\.(ts|tsx)$' | xargs grep -E "=== '(admin|artist|free|pro|business|unlimited)'"; then
  echo "❌ Error: Found string literals. Use constants instead!"
  echo "   Import from: @/domain/types/user-roles or @/domain/types/subscriptions"
  exit 1
fi

echo "✅ All checks passed!"
```

---

## 🎨 VSCode Integration

Add to `.vscode/settings.json`:

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },

  // Highlight string literals
  "editor.tokenColorCustomizations": {
    "textMateRules": [
      {
        "scope": "string.quoted.single.ts",
        "settings": {
          "foreground": "#ff0000"  // Red for single quotes
        }
      }
    ]
  }
}
```

---

## 🚀 CI/CD Integration

Add to GitHub Actions (`.github/workflows/ci.yml`):

```yaml
name: Code Standards Check

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check for string literals
        run: |
          if grep -r "=== '\(admin\|artist\|free\|pro\)" app/ components/ hooks/ lib/; then
            echo "Error: String literals found!"
            exit 1
          fi

      - name: Check SOLID principles
        run: |
          # Check for direct SQL in API routes
          if grep -r "await sql\`" app/api/; then
            echo "Error: Direct SQL queries in API routes!"
            exit 1
          fi
```

---

## 📊 Enforcement Levels

1. **Level 1 - Warnings** (Current)
   - ESLint warnings for violations
   - Manual code review

2. **Level 2 - Pre-commit** (Recommended)
   - Block commits with violations
   - Force developer to fix before committing

3. **Level 3 - CI/CD** (Production)
   - Block PRs with violations
   - Automated checks in pipeline

---

## 🔧 Implementation Plan

1. [ ] Add ESLint rules to `.eslintrc.json`
2. [ ] Create pre-commit hook
3. [ ] Add VSCode settings
4. [ ] Configure CI/CD checks
5. [ ] Create custom ESLint plugin (advanced)
6. [ ] Document exceptions (if any)

---

*Note: Some rules may need exceptions. Document ALL exceptions with reasoning.*
