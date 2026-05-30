import {http} from './http';

export type Doc = {id: string; title: string; icon?: string | null};

export type DocDetail = {
  id: string;
  title: string;
  icon?: string | null;
  // Server returns ProseMirror JSON; rendered best-effort on mobile.
  content?: unknown;
  plainText?: string;
  updatedAt?: string;
};

export function listDocuments(workspaceId: string): Promise<Doc[]> {
  return http<Doc[]>(`/workspaces/${workspaceId}/documents`);
}

export function getDocument(docId: string): Promise<DocDetail> {
  return http<DocDetail>(`/documents/${docId}`);
}

export function summarizeDocument(
  documentId: string,
  length: 'short' | 'medium' | 'long' = 'short',
): Promise<{summary: string}> {
  return http<{summary: string}>('/ai/summarize', {
    method: 'POST',
    body: JSON.stringify({documentId, length}),
  });
}
