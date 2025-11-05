#!/usr/bin/env tsx
/**
 * Clone Workflow Script
 *
 * Creates a copy of an existing workflow with a new name.
 *
 * Usage:
 *   npx tsx scripts/clone-workflow.ts <workflow-id> --name "New Name"
 *   npx tsx scripts/clone-workflow.ts <workflow-id> --name "New Name" --description "New description"
 */

import { postgresDb } from '../src/lib/db';
import { workflowsTablePostgres } from '../src/lib/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

interface CloneOptions {
  name: string;
  description?: string;
}

async function cloneWorkflow(workflowId: string, options: CloneOptions): Promise<void> {
  if (!postgresDb) {
    console.error('❌ Database not initialized');
    process.exit(1);
  }

  try {
    // Fetch existing workflow
    const workflows = await postgresDb
      .select()
      .from(workflowsTablePostgres)
      .where(eq(workflowsTablePostgres.id, workflowId))
      .limit(1);

    if (workflows.length === 0) {
      console.error(`❌ Workflow not found: ${workflowId}`);
      process.exit(1);
    }

    const originalWorkflow = workflows[0];
    console.log(`📋 Cloning workflow: ${originalWorkflow.name}`);

    // Create new workflow with same config
    const newId = randomUUID();
    const newName = options.name;
    const newDescription = options.description || `Copy of ${originalWorkflow.description || originalWorkflow.name}`;

    await postgresDb.insert(workflowsTablePostgres).values({
      id: newId,
      userId: originalWorkflow.userId,
      organizationId: originalWorkflow.organizationId,
      name: newName,
      description: newDescription,
      prompt: `Cloned from: ${originalWorkflow.name}`,
      config: originalWorkflow.config,
      trigger: originalWorkflow.trigger,
      status: 'draft', // Always start as draft
    });

    console.log('\n✅ Workflow cloned successfully!');
    console.log(`   Original ID: ${workflowId}`);
    console.log(`   New ID: ${newId}`);
    console.log(`   New Name: ${newName}`);
    console.log(`   Status: draft`);
    console.log(`\n🌐 View at: http://localhost:3000/dashboard/workflows`);
    console.log(`\n💡 Tip: Activate the cloned workflow:`);
    console.log(`   npx tsx scripts/update-workflow.ts ${newId} --status active`);
  } catch (error) {
    console.error('❌ Failed to clone workflow:', error);
    process.exit(1);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  npx tsx scripts/clone-workflow.ts <workflow-id> --name "New Name" [options]

Required:
  workflow-id         ID of the workflow to clone
  --name <name>      Name for the cloned workflow

Options:
  --description <text>  Description for the cloned workflow
  --help               Show this help message

Examples:
  npx tsx scripts/clone-workflow.ts abc123 --name "My Workflow v2"
  npx tsx scripts/clone-workflow.ts abc123 --name "Test Version" --description "Testing changes"

Tip: List workflows to find IDs:
  npx tsx scripts/list-workflows.ts
  `);
  process.exit(0);
}

const workflowId = args[0];
const options: Partial<CloneOptions> = {};

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--name' && args[i + 1]) {
    options.name = args[i + 1];
    i++;
  } else if (args[i] === '--description' && args[i + 1]) {
    options.description = args[i + 1];
    i++;
  }
}

if (!options.name) {
  console.error('❌ Missing required option: --name');
  console.error('   Usage: npx tsx scripts/clone-workflow.ts <id> --name "New Name"');
  process.exit(1);
}

cloneWorkflow(workflowId, options as CloneOptions).catch(console.error);
