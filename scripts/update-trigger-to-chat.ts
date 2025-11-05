import { postgresDb } from '../src/lib/db';
import { workflowsTablePostgres } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

async function updateTrigger() {
  if (!postgresDb) {
    console.error('Database not initialized');
    process.exit(1);
  }

  // Find the "Simple AI Chat" workflow
  const workflows = await postgresDb
    .select()
    .from(workflowsTablePostgres)
    .where(eq(workflowsTablePostgres.name, 'Simple AI Chat'))
    .limit(1);

  if (workflows.length === 0) {
    console.error('Workflow not found');
    process.exit(1);
  }

  const workflow = workflows[0];
  console.log(`Found workflow: ${workflow.id}`);

  // Update trigger to chat type
  await postgresDb
    .update(workflowsTablePostgres)
    .set({
      trigger: JSON.stringify({
        type: 'chat',
        config: {}
      })
    } as Record<string, unknown>)
    .where(eq(workflowsTablePostgres.id, workflow.id));

  console.log('✅ Updated trigger type to "chat"');
  console.log('🌐 View at: http://localhost:3000/dashboard/workflows');
  console.log('💬 Click the "Chat" button to interact with the workflow');
  process.exit(0);
}

updateTrigger().catch(console.error);
