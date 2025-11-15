import { getModuleRegistry } from '@/lib/workflows/module-registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/modules/search?q=keyword&limit=10
// Search for modules (no auth required for agent use)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    const registry = getModuleRegistry();
    const results: Array<{
      path: string;
      description: string;
      signature: string;
    }> = [];

    // Search through all categories and modules
    for (const category of registry) {
      for (const mod of category.modules) {
        for (const func of mod.functions) {
          const modulePath = `${category.name}.${mod.name}.${func.name}`;
          const searchText = `${modulePath} ${func.description} ${func.signature}`.toLowerCase();

          if (searchText.includes(query)) {
            results.push({
              path: modulePath,
              description: func.description,
              signature: func.signature,
            });

            if (results.length >= limit) {
              return Response.json({ results, total: results.length });
            }
          }
        }
      }
    }

    return Response.json({ results, total: results.length });
  } catch (error) {
    console.error('Module search error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
