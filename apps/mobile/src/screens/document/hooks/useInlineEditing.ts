import {useRef, useState} from 'react';
import type {
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';

import {useInlineAI, type InlineAction} from '@/hooks';

// Inline AI editing over the current editor selection. Wraps the streaming
// useInlineAI hook and owns the selection lifecycle:
//   - tracks the live selection so the toolbar/replace can target it,
//   - snapshots the exact span an action launched against, so a concurrent
//     (remote) edit that shifts the span can be detected, and
//   - refuses to "Replace" once those offsets are stale (splicing by them would
//     corrupt the doc).
// The replace is applied as a normal local edit via setText, so it propagates to
// every peer through the CRDT like any other change.
export type InlineEditing = {
  selectedText: string;
  hasSelection: boolean;
  onSelectionChange: (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => void;
  action: InlineAction | null;
  result: string;
  isStreaming: boolean;
  error: string | null;
  staleSpan: boolean;
  run: (action: InlineAction) => void;
  apply: () => void;
  dismiss: () => void;
};

export function useInlineEditing(params: {
  workspaceId: string;
  text: string;
  setText: (next: string) => void;
}): InlineEditing {
  const {workspaceId, text, setText} = params;
  const inline = useInlineAI(workspaceId);

  const [selection, setSelection] = useState({start: 0, end: 0});
  const [staleSpan, setStaleSpan] = useState(false);
  const spanRef = useRef<{start: number; end: number; text: string} | null>(null);

  const selectedText = text.slice(selection.start, selection.end);
  const hasSelection = selection.end > selection.start;

  const dismiss = () => {
    spanRef.current = null;
    setStaleSpan(false);
    inline.reset();
  };

  const onSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    setSelection(e.nativeEvent.selection);
    // Selecting fresh text invalidates a previous inline result.
    if (inline.action) dismiss();
  };

  const run = (action: InlineAction) => {
    spanRef.current = {start: selection.start, end: selection.end, text: selectedText};
    setStaleSpan(false);
    inline.run(action, selectedText);
  };

  const apply = () => {
    const span = spanRef.current;
    if (!span || text.slice(span.start, span.end) !== span.text) {
      setStaleSpan(true);
      return;
    }
    setText(text.slice(0, span.start) + inline.result + text.slice(span.end));
    dismiss();
  };

  return {
    selectedText,
    hasSelection,
    onSelectionChange,
    action: inline.action,
    result: inline.result,
    isStreaming: inline.isStreaming,
    error: inline.error,
    staleSpan,
    run,
    apply,
    dismiss,
  };
}
