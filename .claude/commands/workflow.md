---
name: workflow
description: Generate and execute a custom workflow from natural language description
---

## Core Rules

1. **MATCH USER REQUEST EXACTLY** - Don't simplify or remove features
2. **DEBUG, DON'T SIMPLIFY** - Fix errors, never create "simpler versions"
3. **PARSE TRIGGER TYPE** - If user says "chat trigger", "webhook", "cron", etc., include it in JSON

## Available Scripts

**Module Discovery:**
- `search-modules.ts "keyword"` - Find modules by keyword
- `search-modules.ts --category ai` - List modules in category
- `module-info.ts ai.ai-sdk.chat` - Detailed info on specific module

**Workflow Management:**
- `list-workflows.ts [--status active] [--trigger chat]` - List all workflows
- `export-workflow.ts <id> [file.json]` - Export to JSON file
- `update-workflow.ts <id> --trigger chat --status active` - Modify workflow
- `clone-workflow.ts <id> --name "New Name"` - Duplicate workflow

**Categories:** communication, social, data, ai, utilities, payments, productivity

## Workflow JSON Structure

```json
{
  "version": "1.0",
  "name": "Workflow Name",
  "description": "What it does",
  "trigger": {
    "type": "manual" | "chat" | "webhook" | "cron" | "telegram" | "discord",
    "config": {}  // cron: { schedule: "0 9 * * *" }, telegram/discord: { command: "/cmd" }
  },
  "config": {
    "steps": [
      {
        "id": "step1",
        "module": "category.module.function",  // lowercase: ai.ai-sdk.chat
        "inputs": { "param": "value" },
        "outputAs": "varName"  // optional
      }
    ],
    "outputDisplay": {  // optional - only if user requests specific format
      "type": "table" | "list" | "text" | "markdown" | "json",
      "columns": [{ "key": "field", "label": "Header", "type": "text" }]
    }
  },
  "metadata": {
    "author": "b0t AI",
    "tags": ["tag1"],
    "category": "utilities",
    "requiresCredentials": ["openai"]  // platforms needing API keys
  }
}
```

**Critical:**
- Module paths: `category.module.function` (all lowercase)
- Variable refs: `{{varName}}`, `{{data.items[0].title}}`
- `version` required (use "1.0")
- `trigger` defaults to "manual" if omitted - **ALWAYS INCLUDE IT IF USER MENTIONS TRIGGER TYPE**

## Workflow Steps

1. **Search modules:** `npx tsx scripts/search-modules.ts "keyword"`
2. **Write JSON:** Save to `/tmp/workflow.json` via bash `cat > /tmp/workflow.json << 'EOF'`
3. **Validate:** `npx tsx scripts/validate-workflow.ts /tmp/workflow.json`
4. **Test:** `npx tsx scripts/test-workflow.ts /tmp/workflow.json`
5. **Import:** `npx tsx scripts/import-workflow.ts /tmp/workflow.json`

## Error Handling

**Test script categorizes errors:**
- ✅ **You fix:** Wrong module path, bad variable refs, type errors
- ⚠️ **User fixes:** Missing API keys, network issues
- 🤝 **Both:** Rate limits, complex logic

**On error:**
1. Read error output carefully
2. Fix the EXACT issue (don't simplify!)
3. Re-test
4. If missing API keys, tell user: "Configure at http://localhost:3000/settings/credentials"

**Never:**
- "Let me create a simpler version"
- "Let's try with fewer steps"
- "Let's remove this feature"

## Key Modules

**Database:** `data.database.{query,insert,update,exists}`
**Dedup:** `utilities.deduplication.{filterProcessed,hasProcessed}`
**Scoring:** `utilities.scoring.{rankByWeightedScore,selectTop}`
**Arrays:** `utilities.array-utils.{pluck,sortBy,first,sum}`

## After Import

- View at: http://localhost:3000/dashboard/workflows
- Button label changes based on trigger: "Chat", "Run", "Webhook", etc.
- Configure via Settings dialog (cron, AI prompts, params)
- Manage API keys via Credentials button

## Workflow Management Scripts

**List workflows:**
```bash
list-workflows.ts                  # All workflows
list-workflows.ts --status active  # Filter by status
list-workflows.ts --trigger chat   # Filter by trigger
```

**Modify workflows:**
```bash
update-workflow.ts <id> --trigger chat --status active
clone-workflow.ts <id> --name "Version 2"
export-workflow.ts <id> backup.json
```
