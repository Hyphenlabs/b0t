#!/usr/bin/env tsx
/**
 * Module Info Script
 *
 * Shows detailed information about a specific module function.
 *
 * Usage:
 *   npx tsx scripts/module-info.ts <module-path>
 *   npx tsx scripts/module-info.ts ai.ai-sdk.chat
 *   npx tsx scripts/module-info.ts utilities.datetime.now
 */

import { getModuleRegistry } from '../src/lib/workflows/module-registry';

function getModuleInfo(modulePath: string): void {
  // Find the module in registry
  const parts = modulePath.split('.');
  if (parts.length !== 3) {
    console.error('❌ Invalid module path. Format: category.module.function');
    console.error('   Example: ai.ai-sdk.chat');
    process.exit(1);
  }

  const [categoryName, moduleName, functionName] = parts;
  const registry = getModuleRegistry();

  // Find category
  const category = registry.find(c =>
    c.name.toLowerCase().replace(/\s+/g, '-') === categoryName ||
    c.name.toLowerCase().replace(/\s+/g, '') === categoryName
  );

  if (!category) {
    console.error(`❌ Category not found: ${categoryName}`);
    console.error(`   Available categories: ${registry.map(c => c.name.toLowerCase().replace(/\s+/g, '-')).join(', ')}`);
    process.exit(1);
  }

  // Find module
  const moduleData = category.modules.find(m => m.name === moduleName);
  if (!moduleData) {
    console.error(`❌ Module not found: ${moduleName}`);
    console.error(`   Available modules in ${category.name}: ${category.modules.map(m => m.name).join(', ')}`);
    process.exit(1);
  }

  // Find function
  const func = moduleData.functions.find(f => f.name === functionName);
  if (!func) {
    console.error(`❌ Function not found: ${functionName}`);
    console.error(`   Available functions in ${moduleName}: ${moduleData.functions.map(f => f.name).join(', ')}`);
    process.exit(1);
  }

  // Display module info
  console.log(`\n📦 Module: ${modulePath}\n`);

  console.log(`📝 Description:`);
  console.log(`   ${func.description}`);
  console.log();

  console.log(`🔧 Signature:`);
  console.log(`   ${func.signature}`);
  console.log();

  if (func.example) {
    console.log(`💡 Example:`);
    console.log(`   ${func.example}`);
    console.log();
  }

  // Module file location
  console.log(`📁 Location:`);
  console.log(`   src/modules/${categoryName}/${moduleName}.ts`);
  console.log();

  // Usage in workflow
  console.log(`📋 Usage in Workflow:`);
  console.log(`   {`);
  console.log(`     "id": "step-1",`);
  console.log(`     "module": "${modulePath}",`);
  console.log(`     "inputs": { /* based on signature above */ },`);
  console.log(`     "outputAs": "result"`);
  console.log(`   }`);
  console.log();

  // Related functions
  const relatedFuncs = moduleData.functions.filter(f => f.name !== functionName);
  if (relatedFuncs.length > 0) {
    console.log(`🔗 Related Functions in ${moduleName}:`);
    relatedFuncs.slice(0, 5).forEach(f => {
      console.log(`   - ${categoryName}.${moduleName}.${f.name} - ${f.description}`);
    });
    if (relatedFuncs.length > 5) {
      console.log(`   ... and ${relatedFuncs.length - 5} more`);
    }
    console.log();
  }

  console.log(`📖 Tip: View source for full documentation:`);
  console.log(`   cat src/modules/${categoryName}/${moduleName}.ts`);
}

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  npx tsx scripts/module-info.ts <module-path>

Arguments:
  module-path    Full module path (category.module.function)

Examples:
  npx tsx scripts/module-info.ts ai.ai-sdk.chat
  npx tsx scripts/module-info.ts utilities.datetime.now
  npx tsx scripts/module-info.ts communication.email.sendEmail

Tip: Use search-modules.ts to find available modules first:
  npx tsx scripts/search-modules.ts "keyword"
  `);
  process.exit(0);
}

getModuleInfo(args[0]);
