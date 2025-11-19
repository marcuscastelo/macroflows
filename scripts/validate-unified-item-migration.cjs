#!/usr/bin/env node
const { readFileSync, existsSync, readdirSync, statSync } = require('fs');
const { join, basename } = require('path');

function globSync(pattern, options) {
  const results = [];
  const ignorePatterns = options.ignore || [];
  function shouldIgnore(filePath) {
    return ignorePatterns.some(p => filePath.includes(p.replace(/\*/g, '')));
  }
  function walk(dir, baseDir = '') {
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        const fullPath = join(dir, file);
        const relativePath = join(baseDir, file);
        if (shouldIgnore(relativePath)) continue;
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath, relativePath);
        } else if (stat.isFile()) {
          const lastPart = pattern.split('/').pop();
          if (lastPart.includes('*')) {
            const regex = new RegExp('^' + lastPart.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$');
            if (regex.test(file)) results.push(relativePath);
          } else if (relativePath.endsWith(lastPart)) results.push(relativePath);
        }
      }
    } catch (error) {}
  }
  const startDir = pattern.includes('**') ? join(options.cwd, pattern.split('**')[0]) : options.cwd;
  walk(startDir);
  return results;
}

function checkLegacyDomainEntities() {
  const legacyPaths = ['src/modules/diet/item/domain', 'src/modules/diet/item-group/domain'];
  const foundPaths = legacyPaths.filter(p => existsSync(join(process.cwd(), p)));
  return foundPaths.length > 0 
    ? { passed: false, message: 'Legacy Item/ItemGroup domain entities still exist', details: foundPaths }
    : { passed: true, message: 'No legacy Item/ItemGroup domain entities found' };
}

function checkConversionUtilities() {
  const patterns = ['*migrate*.ts', '*legacy*.ts', '*convert*Legacy*.ts'];
  const excludePatterns = ['node_modules', 'convertApi2Food.ts', 'validate-unified-item-migration'];
  let allFiles = [];
  patterns.forEach(pattern => {
    allFiles = [...allFiles, ...globSync(`src/**/${pattern}`, { ignore: excludePatterns, cwd: process.cwd() })];
  });
  const actualMigrationFiles = allFiles.filter(f => !basename(f).includes('validate-unified-item-migration') && !basename(f).includes('convertApi2Food'));
  return actualMigrationFiles.length > 0
    ? { passed: false, message: 'Legacy conversion utilities still present', details: actualMigrationFiles }
    : { passed: true, message: 'No legacy conversion utilities found' };
}

function checkUnifiedItemUsage() {
  const mealDomainFile = 'src/modules/diet/meal/domain/meal.ts';
  try {
    const mealPath = join(process.cwd(), mealDomainFile);
    if (!existsSync(mealPath)) return { passed: false, message: 'Meal domain file not found', details: [mealDomainFile] };
    const mealContent = readFileSync(mealPath, 'utf-8');
    const mealUsesUnified = mealContent.includes('unifiedItemSchema') || mealContent.includes('UnifiedItem');
    return mealUsesUnified
      ? { passed: true, message: 'Core domain entities use UnifiedItem structure' }
      : { passed: false, message: 'Meal domain does not use UnifiedItem', details: [mealDomainFile] };
  } catch (error) {
    return { passed: false, message: 'Error checking UnifiedItem usage', details: [String(error)] };
  }
}

function checkDatabaseSchema() {
  try {
    const dbTypesPath = join(process.cwd(), 'src/shared/supabase/database.types.ts');
    const recipesSchemaPath = join(process.cwd(), 'database/recipes.sql');
    const dbTypes = existsSync(dbTypesPath) ? readFileSync(dbTypesPath, 'utf-8') : '';
    const recipesSchema = existsSync(recipesSchemaPath) ? readFileSync(recipesSchemaPath, 'utf-8') : '';
    const recipesUsesJsonb = recipesSchema.includes('items jsonb');
    const daysStoresMeals = dbTypes.includes('meals: Json') || dbTypes.includes('meals: json');
    const issues = [];
    if (!recipesUsesJsonb && recipesSchema) issues.push('recipes table does not use JSONB for items');
    if (!daysStoresMeals) issues.push('days table does not store meals as JSON');
    return issues.length > 0
      ? { passed: false, message: 'Database schema issues detected', details: issues }
      : { passed: true, message: 'Database schema uses JSONB/JSON for items and meals' };
  } catch (error) {
    return { passed: false, message: 'Error checking database schema', details: [String(error)] };
  }
}

function checkDeprecatedReferences() {
  const excludePatterns = ['node_modules', 'database.types.ts', 'validate-unified-item-migration', '.test.ts'];
  const deprecatedPatterns = [/import.*Item.*from.*['"].*\/item\/domain/, /import.*ItemGroup.*from.*['"].*\/item-group\/domain/];
  const allFiles = globSync('src/**/*.ts', { ignore: excludePatterns, cwd: process.cwd() })
    .concat(globSync('src/**/*.tsx', { ignore: excludePatterns, cwd: process.cwd() }));
  const filesWithDeprecatedRefs = [];
  allFiles.forEach(file => {
    try {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');
      if (deprecatedPatterns.some(p => p.test(content))) filesWithDeprecatedRefs.push(file);
    } catch (error) {}
  });
  return filesWithDeprecatedRefs.length > 0
    ? { passed: false, message: 'Found deprecated Item/ItemGroup references in code', details: filesWithDeprecatedRefs.slice(0, 10) }
    : { passed: true, message: 'No deprecated Item/ItemGroup references found in code' };
}

console.log('🔍 Running Phase 5 Migration Validation...\n');
const report = { timestamp: new Date(), phase: 'Phase 5: Cleanup and Optimization', checks: {}, overallStatus: 'PASSED' };
const checks = [
  { name: 'Legacy Domain Entities', fn: checkLegacyDomainEntities },
  { name: 'Conversion Utilities', fn: checkConversionUtilities },
  { name: 'UnifiedItem Usage', fn: checkUnifiedItemUsage },
  { name: 'Database Schema', fn: checkDatabaseSchema },
  { name: 'Deprecated References', fn: checkDeprecatedReferences }
];

checks.forEach(check => {
  console.log(`Running: ${check.name}...`);
  const result = check.fn();
  report.checks[check.name] = result;
  if (!result.passed) report.overallStatus = 'FAILED';
  console.log(`${result.passed ? '✅' : '❌'} ${result.message}`);
  if (result.details) result.details.forEach(d => console.log(`   - ${d}`));
  console.log();
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Overall Status: ${report.overallStatus}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (report.overallStatus === 'FAILED') {
  console.error('❌ Migration validation failed. Please address the issues above.');
  process.exit(1);
} else {
  console.log('✅ Phase 5 migration validation passed!');
  console.log('   All Item/ItemGroup references have been successfully migrated to UnifiedItem.');
  process.exit(0);
}
