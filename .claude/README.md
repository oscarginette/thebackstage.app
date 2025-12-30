# .claude/ - Project Standards & Guidelines

## 📚 Documentation Index

### 🚨 **START HERE - MANDATORY READING**

1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ⚡
   - Quick cheat sheet
   - Import statements
   - Pre-commit checklist
   - **Read this FIRST before coding**

2. **[CODE_STANDARDS.md](./CODE_STANDARDS.md)** 📜
   - Complete code standards (MANDATORY)
   - SOLID principles with examples
   - Clean Code standards
   - Anti-patterns to avoid
   - **This is the law of the codebase**

3. **[CLAUDE.md](./CLAUDE.md)** 🏗️
   - Clean Architecture guide
   - Layer structure
   - GDPR & CAN-SPAM compliance
   - Example implementations
   - **Architectural reference**

---

### 🛠️ Additional Resources

4. **[ESLINT_RULES.md](./ESLINT_RULES.md)** 🔧
   - Automated enforcement guide
   - ESLint configuration
   - Pre-commit hooks
   - CI/CD integration

5. **[hooks/](./hooks/)** 🪝
   - Claude Code hooks (if any)
   - Custom event handlers

6. **[skills/](./skills/)** 🎯
   - Reusable skills
   - Domain entity documentation

---

## 🎯 Quick Start

### For New Developers

1. Read `QUICK_REFERENCE.md` (2 minutes)
2. Read `CODE_STANDARDS.md` (15 minutes)
3. Skim `CLAUDE.md` for architecture overview (10 minutes)
4. Look at example: `domain/services/UnsubscribeUseCase.ts`
5. Start coding with standards in mind

### For Code Reviews

Use this checklist from `CODE_STANDARDS.md`:

- [ ] No string literals (using constants)
- [ ] SRP: Each class/function has ONE responsibility
- [ ] DIP: Depending on interfaces
- [ ] Clean Code: Functions < 30 lines
- [ ] No business logic in API routes
- [ ] Error handling explicit
- [ ] No magic numbers

---

## 🔑 Core Principles (Never Compromise)

1. **NEVER use string literals** for domain values
   - Import: `USER_ROLES`, `SUBSCRIPTION_PLANS`, `CONSENT_ACTIONS`

2. **ALWAYS follow SOLID principles**
   - Single Responsibility
   - Dependency Inversion
   - Interface Segregation

3. **ALWAYS use Clean Architecture**
   - Domain layer has NO external dependencies
   - API routes ONLY orchestrate, NO business logic
   - Depend on interfaces, NOT concrete classes

4. **ALWAYS write Clean Code**
   - Functions < 30 lines
   - Descriptive names
   - Explicit error handling
   - Extract constants for magic values

---

## 📊 Standards Enforcement

| Level | Method | Status |
|-------|--------|--------|
| Manual | Code Review | ✅ Active |
| ESLint | Warnings | 🟡 Recommended |
| Pre-commit | Block bad commits | 🟡 Recommended |
| CI/CD | Block bad PRs | 🔴 TODO |

---

## 🆘 Need Help?

1. **Examples in the codebase**:
   - `domain/services/UnsubscribeUseCase.ts` - Perfect Use Case
   - `domain/entities/ConsentHistory.ts` - Perfect Entity
   - `domain/entities/User.ts` - Entity with constants

2. **Documentation**:
   - Check `docs/` folder for technical docs
   - See `README.md` in project root

3. **Questions**:
   - Review `CODE_STANDARDS.md` FAQ section
   - Ask in team chat
   - Check existing PRs for examples

---

## 📝 Updating Standards

When updating standards:

1. Update the relevant `.md` file
2. Update this README if adding new files
3. Communicate changes to team
4. Update `*Last Updated*` date
5. Increment version if major changes

---

## 🏆 Quality Metrics

**Current Status**:
- ✅ All constants defined
- ✅ No string literals in main codebase
- ✅ SOLID principles followed
- ✅ Clean Architecture implemented
- ✅ Build passes all type checks

**Goals**:
- 🎯 Zero ESLint violations
- 🎯 Automated enforcement via pre-commit
- 🎯 CI/CD blocking bad code
- 🎯 100% test coverage for Use Cases

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-30 | Initial standards documentation |
| | | - Created CODE_STANDARDS.md |
| | | - Added constants enforcement |
| | | - Updated CLAUDE.md with constants section |

---

**Remember**: These standards exist to make our codebase maintainable, scalable, and a joy to work with. They are not suggestions—they are requirements.

*"Always code as if the person who ends up maintaining your code is a violent psychopath who knows where you live."* - Martin Golding
