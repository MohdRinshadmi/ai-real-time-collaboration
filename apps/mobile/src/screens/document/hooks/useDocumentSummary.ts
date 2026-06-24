import {useState} from 'react';

import {documentsApi} from '@/api';

// One-shot whole-document summary via the AI gateway. Owns its own request
// state so the screen just renders {summary, summarizing} and calls summarize().
export type DocumentSummary = {
  summary: string | null;
  summarizing: boolean;
  summarize: () => Promise<void>;
};

export function useDocumentSummary(docId: string): DocumentSummary {
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const summarize = async () => {
    setSummarizing(true);
    setSummary(null);
    try {
      const res = await documentsApi.summarizeDocument(docId, 'short');
      setSummary(res.summary);
    } catch {
      setSummary('Could not generate a summary right now.');
    } finally {
      setSummarizing(false);
    }
  };

  return {summary, summarizing, summarize};
}
