#!/usr/bin/env ts-node
/**
 * Auto-generate domain entities documentation
 *
 * Scans domain/entities/*.ts and extracts:
 * - Entity name
 * - Properties and types
 * - Factory methods
 * - Validation rules
 * - Business methods
 *
 * Outputs to .claude/skills/domain-entities.md
 */

import * as fs from 'fs';
import * as path from 'path';

interface EntityField {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}

interface EntityMethod {
  name: string;
  signature: string;
  description?: string;
}

interface EntityInfo {
  name: string;
  filePath: string;
  fields: EntityField[];
  factoryMethods: EntityMethod[];
  businessMethods: EntityMethod[];
  types: string[];
}

const ENTITIES_DIR = path.join(process.cwd(), 'domain', 'entities');
const OUTPUT_FILE = path.join(process.cwd(), '.claude', 'skills', 'domain-entities.md');

/**
 * Parse TypeScript entity file to extract structure
 */
function parseEntityFile(filePath: string): EntityInfo | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.ts');

  const entity: EntityInfo = {
    name: fileName,
    filePath: `domain/entities/${fileName}.ts`,
    fields: [],
    factoryMethods: [],
    businessMethods: [],
    types: [],
  };

  // Extract type definitions (e.g., UserRole, SubscriptionTier)
  const typeRegex = /export type (\w+) = ([^;]+);/g;
  let typeMatch;
  while ((typeMatch = typeRegex.exec(content)) !== null) {
    entity.types.push(`${typeMatch[1]} = ${typeMatch[2].trim()}`);
  }

  // Extract interface properties (xxxProps interface)
  const interfaceRegex = new RegExp(`export interface ${fileName}Props\\s*{([^}]+)}`, 's');
  const interfaceMatch = interfaceRegex.exec(content);

  if (interfaceMatch) {
    const propsContent = interfaceMatch[1];
    const propLines = propsContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));

    for (const line of propLines) {
      const propMatch = line.match(/^\s*(\w+)(\??):\s*([^;]+);?/);
      if (propMatch) {
        const [, name, optional, type] = propMatch;
        entity.fields.push({
          name,
          type: type.trim(),
          optional: optional === '?',
        });
      }
    }
  } else {
    // Try to extract from class constructor parameters (public readonly pattern)
    const constructorRegex = /constructor\s*\(([\s\S]*?)\)/;
    const constructorMatch = constructorRegex.exec(content);

    if (constructorMatch) {
      const params = constructorMatch[1];
      const paramLines = params.split(',').filter(line => line.trim());

      for (const line of paramLines) {
        const paramMatch = line.match(/public\s+readonly\s+(\w+)(\??):\s*([^,\n]+)/);
        if (paramMatch) {
          const [, name, optional, type] = paramMatch;
          entity.fields.push({
            name,
            type: type.trim(),
            optional: optional === '?',
          });
        }
      }
    }
  }

  // Extract static factory methods
  const staticMethodRegex = /static\s+(?:async\s+)?(\w+)\s*\([^)]*\):\s*([^{]+)\s*{/g;
  let staticMatch;
  while ((staticMatch = staticMethodRegex.exec(content)) !== null) {
    const methodName = staticMatch[1];
    const fullSignature = content.substring(
      staticMatch.index,
      content.indexOf('{', staticMatch.index)
    ).trim();

    // Extract JSDoc comment if exists
    const jsdocRegex = /\/\*\*([^*]|\*(?!\/))*\*\/\s*static/;
    const beforeMethod = content.substring(Math.max(0, staticMatch.index - 300), staticMatch.index);
    const jsdocMatch = beforeMethod.match(jsdocRegex);
    let description = '';

    if (jsdocMatch) {
      const jsdocContent = jsdocMatch[0];
      const descLines = jsdocContent
        .split('\n')
        .map(l => l.replace(/^\s*\*\s?/, '').trim())
        .filter(l => l && !l.startsWith('@') && !l.startsWith('/**') && !l.startsWith('*/'));
      description = descLines.join(' ');
    }

    entity.factoryMethods.push({
      name: methodName,
      signature: fullSignature.replace(/\s+/g, ' '),
      description,
    });
  }

  // Extract public business methods (non-getters, non-static)
  const publicMethodRegex = /^\s+(?:async\s+)?(\w+)\s*\([^)]*\):\s*[^{]+\s*{/gm;
  let publicMatch;
  while ((publicMatch = publicMethodRegex.exec(content)) !== null) {
    const methodName = publicMatch[1];

    // Skip getters, private methods, constructor, validate
    if (
      methodName.startsWith('get') ||
      methodName === 'constructor' ||
      methodName === 'validate' ||
      content.substring(Math.max(0, publicMatch.index - 10), publicMatch.index).includes('private')
    ) {
      continue;
    }

    const fullSignature = content.substring(
      publicMatch.index,
      content.indexOf('{', publicMatch.index)
    ).trim();

    // Extract JSDoc
    const jsdocRegex = /\/\*\*([^*]|\*(?!\/))*\*\/\s*(?:async\s+)?\w+/;
    const beforeMethod = content.substring(Math.max(0, publicMatch.index - 300), publicMatch.index);
    const jsdocMatch = beforeMethod.match(jsdocRegex);
    let description = '';

    if (jsdocMatch) {
      const jsdocContent = jsdocMatch[0];
      const descLines = jsdocContent
        .split('\n')
        .map(l => l.replace(/^\s*\*\s?/, '').trim())
        .filter(l => l && !l.startsWith('@') && !l.startsWith('/**') && !l.startsWith('*/'));
      description = descLines.join(' ');
    }

    entity.businessMethods.push({
      name: methodName,
      signature: fullSignature.replace(/\s+/g, ' '),
      description,
    });
  }

  return entity.fields.length > 0 ? entity : null;
}

/**
 * Generate markdown documentation for all entities
 */
function generateDocumentation(entities: EntityInfo[]): string {
  const timestamp = new Date().toISOString();

  let markdown = `---
skill: domain-entities
description: Complete reference of all domain entities with fields, types, and methods. Auto-generated from source code.
---

# Domain Entities Reference

**Auto-generated**: ${timestamp}
**Source**: \`domain/entities/*.ts\`

> This documentation is automatically updated when any entity file is modified.
> Use this as the source of truth for entity structure, field names, and types.

---

## Table of Contents

${entities.map(e => `- [${e.name}](#${e.name.toLowerCase()})`).join('\n')}

---

`;

  for (const entity of entities) {
    markdown += `## ${entity.name}\n\n`;
    markdown += `**Location**: \`${entity.filePath}\`\n\n`;

    // Types
    if (entity.types.length > 0) {
      markdown += `### Types\n\n`;
      markdown += '```typescript\n';
      entity.types.forEach(type => {
        markdown += `export type ${type}\n`;
      });
      markdown += '```\n\n';
    }

    // Fields
    if (entity.fields.length > 0) {
      markdown += `### Fields\n\n`;
      markdown += '| Field | Type | Optional | Description |\n';
      markdown += '|-------|------|----------|-------------|\n';

      for (const field of entity.fields) {
        const optional = field.optional ? '✓' : '';
        const description = field.description || '';
        markdown += `| \`${field.name}\` | \`${field.type}\` | ${optional} | ${description} |\n`;
      }
      markdown += '\n';
    }

    // Factory Methods
    if (entity.factoryMethods.length > 0) {
      markdown += `### Factory Methods\n\n`;

      for (const method of entity.factoryMethods) {
        markdown += `#### \`${method.name}()\`\n\n`;
        if (method.description) {
          markdown += `${method.description}\n\n`;
        }
        markdown += '```typescript\n';
        markdown += `${method.signature}\n`;
        markdown += '```\n\n';
      }
    }

    // Business Methods
    if (entity.businessMethods.length > 0) {
      markdown += `### Business Methods\n\n`;

      for (const method of entity.businessMethods) {
        markdown += `#### \`${method.name}()\`\n\n`;
        if (method.description) {
          markdown += `${method.description}\n\n`;
        }
        markdown += '```typescript\n';
        markdown += `${method.signature}\n`;
        markdown += '```\n\n';
      }
    }

    markdown += '---\n\n';
  }

  // Add usage guide
  markdown += `## Usage Guide

### When to Use This Skill

1. **Creating/Updating Repositories**: Verify field names and types
2. **Writing Migrations**: Ensure database schema matches entity structure
3. **Implementing Use Cases**: Reference factory methods and business logic
4. **Data Validation**: Check required vs optional fields
5. **Type Safety**: Use exact type definitions from entities

### Best Practices

- ✅ Always reference this documentation when working with entity fields
- ✅ Use factory methods instead of \`new Entity()\` directly
- ✅ Respect the Clean Architecture boundary (no external deps in entities)
- ✅ Validate data using entity validation methods
- ❌ Don't modify entity structure without updating related repositories
- ❌ Don't add external dependencies to entity files

### Related Documentation

- **Clean Architecture Guidelines**: \`.claude/CLAUDE.md\`
- **Repository Interfaces**: \`domain/repositories/\`
- **Use Cases**: \`domain/services/\`

---

*Last updated: ${timestamp}*
*Generated by: \`scripts/update-entity-docs.ts\`*
`;

  return markdown;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning domain entities...');

  const entityFiles = fs.readdirSync(ENTITIES_DIR)
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(ENTITIES_DIR, file));

  const entities: EntityInfo[] = [];

  for (const filePath of entityFiles) {
    console.log(`  Parsing ${path.basename(filePath)}...`);
    const entity = parseEntityFile(filePath);
    if (entity) {
      entities.push(entity);
    }
  }

  console.log(`\n✅ Found ${entities.length} entities`);
  console.log(`📝 Generating documentation...`);

  const markdown = generateDocumentation(entities.sort((a, b) => a.name.localeCompare(b.name)));

  // Ensure .claude/skills directory exists
  const skillsDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');

  console.log(`\n✅ Documentation written to: ${OUTPUT_FILE}`);
  console.log(`📊 Total entities documented: ${entities.length}`);
  console.log(`\n🎉 Done! Your domain-entities skill is ready to use.`);
}

main();
