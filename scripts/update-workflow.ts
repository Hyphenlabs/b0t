#!/usr/bin/env tsx
/**
 * Update Workflow Script
 *
 * Updates workflow properties (trigger, status, name, description).
 *
 * Usage:
 *   npx tsx scripts/update-workflow.ts <workflow-id> [options]
 *   npx tsx scripts/update-workflow.ts abc123 --trigger chat
 *   npx tsx scripts/update-workflow.ts abc123 --status active
 *   npx tsx scripts/update-workflow.ts abc123 --name "New Name" --description "Updated description"
 */

import { postgresDb } from '../src/lib/db';
import { workflowsTablePostgres } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

interface UpdateOptions {
  trigger?: string;
  status?: string;
  name?: string;
  description?: string;
}

async function updateWorkflow(workflowId: string, options: UpdateOptions): Promise<void> {
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

    const workflow = workflows[0];
    console.log(`📝 Updating workflow: ${workflow.name}`);

    // Build update object
    const updates: Record<string, unknown> = {};

    if (options.trigger) {
      const validTriggers = ['manual', 'chat', 'webhook', 'cron', 'telegram', 'discord'];
      if (!validTriggers.includes(options.trigger)) {
        console.error(`❌ Invalid trigger type: ${options.trigger}`);
        console.error(`   Valid types: ${validTriggers.join(', ')}`);
        process.exit(1);
      }
      updates.trigger = JSON.stringify({ type: options.trigger, config: {} });
      console.log(`   Trigger: ${options.trigger}`);
    }

    if (options.status) {
      const validStatuses = ['draft', 'active', 'paused', 'error'];
      if (!validStatuses.includes(options.status)) {
        console.error(`❌ Invalid status: ${options.status}`);
        console.error(`   Valid statuses: ${validStatuses.join(', ')}`);
        process.exit(1);
      }
      updates.status = options.status;
      console.log(`   Status: ${options.status}`);
    }

    if (options.name) {
      updates.name = options.name;
      console.log(`   Name: ${options.name}`);
    }

    if (options.description !== undefined) {
      updates.description = options.description;
      console.log(`   Description: ${options.description}`);
    }

    if (Object.keys(updates).length === 0) {
      console.error('❌ No updates specified. Use --trigger, --status, --name, or --description');
      process.exit(1);
    }

    // Update workflow
    await postgresDb
      .update(workflowsTablePostgres)
      .set(updates)
      .where(eq(workflowsTablePostgres.id, workflowId));

    console.log('\n✅ Workflow updated successfully!');
    console.log(`🌐 View at: http://localhost:3000/dashboard/workflows`);
  } catch (error) {
    console.error('❌ Failed to update workflow:', error);
    process.exit(1);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  npx tsx scripts/update-workflow.ts <workflow-id> [options]

Options:
  --trigger <type>        Update trigger type (manual, chat, webhook, cron, telegram, discord)
  --status <status>       Update status (draft, active, paused, error)
  --name <name>          Update workflow name
  --description <text>   Update workflow description
  --help                 Show this help message

Examples:
  npx tsx scripts/update-workflow.ts abc123 --trigger chat
  npx tsx scripts/update-workflow.ts abc123 --status active
  npx tsx scripts/update-workflow.ts abc123 --name "New Name" --description "Updated"
  npx tsx scripts/update-workflow.ts abc123 --trigger chat --status active
  `);
  process.exit(0);
}

const workflowId = args[0];
const options: UpdateOptions = {};

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--trigger' && args[i + 1]) {
    options.trigger = args[i + 1];
    i++;
  } else if (args[i] === '--status' && args[i + 1]) {
    options.status = args[i + 1];
    i++;
  } else if (args[i] === '--name' && args[i + 1]) {
    options.name = args[i + 1];
    i++;
  } else if (args[i] === '--description' && args[i + 1]) {
    options.description = args[i + 1];
    i++;
  }
}

updateWorkflow(workflowId, options).catch(console.error);
