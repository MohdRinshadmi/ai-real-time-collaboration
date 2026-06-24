import { retrieve } from '../rag/retriever';
import type { ToolDef } from '../providers/types';

// Tools the chat model may call (function calling). Each tool is a JSON-Schema
// declaration the model sees, plus an `execute` that runs server-side. Tools are
// workspace-scoped: the workspaceId is bound from the request, never from model
// input, so the model can't reach across tenants.
//
// Kept deliberately read-only here — adding a write tool (e.g. create_task)
// would follow the same shape but must go through the same authz as the BFF.

export type ToolContext = { workspaceId: string };

export type Tool = ToolDef & {
  execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
};

const searchWorkspace: Tool = {
  name: 'search_workspace',
  description:
    'Semantic search over the documents in the current workspace. Use this to ' +
    'ground answers in the team’s actual content before responding.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural-language search query.',
      },
      limit: {
        type: 'integer',
        description: 'Max number of chunks to return (1-10).',
      },
    },
    required: ['query'],
  },
  async execute(args, ctx) {
    const query = String(args.query ?? '').trim();
    if (!query) return { results: [] };
    const limit = clamp(Number(args.limit ?? 5), 1, 10);
    const chunks = await retrieve(ctx.workspaceId, query, limit);
    return {
      results: chunks.map((c) => ({
        documentId: c.documentId,
        chunkIndex: c.chunkIndex,
        score: Number(c.score.toFixed(3)),
        excerpt: c.content.slice(0, 400),
      })),
    };
  },
};

const getCurrentDatetime: Tool = {
  name: 'get_current_datetime',
  description:
    'Returns the current UTC date and time. Use when the user asks about ' +
    'today, deadlines, or anything relative to "now".',
  parameters: { type: 'object', properties: {} },
  async execute() {
    return { iso: new Date().toISOString() };
  },
};

const REGISTRY: Tool[] = [searchWorkspace, getCurrentDatetime];

export const toolDefs: ToolDef[] = REGISTRY.map(({ name, description, parameters }) => ({
  name,
  description,
  parameters,
}));

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<unknown> {
  const tool = REGISTRY.find((t) => t.name === name);
  if (!tool) return { error: `Unknown tool: ${name}` };
  try {
    return await tool.execute(args, ctx);
  } catch (err) {
    return { error: (err as Error).message };
  }
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
