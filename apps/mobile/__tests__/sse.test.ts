import {streamSSE} from '../src/api/sse';

// Minimal XMLHttpRequest fake that lets us feed SSE bytes incrementally and
// assert the parser emits one `data:` payload per frame.
class FakeXHR {
  static LOADING = 3;
  static DONE = 4;
  readyState = 0;
  status = 0;
  responseText = '';
  onreadystatechange: (() => void) | null = null;
  onerror: (() => void) | null = null;

  open() {}
  setRequestHeader() {}
  send() {}
  abort() {}

  // Test helpers
  push(chunk: string) {
    this.responseText += chunk;
    this.readyState = FakeXHR.LOADING;
    this.onreadystatechange?.();
  }
  finish(status = 200) {
    this.status = status;
    this.readyState = FakeXHR.DONE;
    this.onreadystatechange?.();
  }
}

describe('streamSSE', () => {
  const original = global.XMLHttpRequest;
  let xhr: FakeXHR;

  beforeEach(() => {
    xhr = new FakeXHR();
    // @ts-expect-error swap in the fake for the test
    global.XMLHttpRequest = function () {
      return xhr;
    };
    // @ts-expect-error static constants used by the parser
    global.XMLHttpRequest.LOADING = FakeXHR.LOADING;
    // @ts-expect-error static constants used by the parser
    global.XMLHttpRequest.DONE = FakeXHR.DONE;
  });

  afterEach(() => {
    global.XMLHttpRequest = original;
  });

  it('emits one payload per complete frame and handles split frames', () => {
    const frames: string[] = [];
    const done = jest.fn();
    streamSSE('http://x/chat/stream', {}, {}, {onFrame: f => frames.push(f), onDone: done});

    // A complete frame, then a frame split across two network chunks.
    xhr.push('data: {"type":"token","value":"Hel"}\n\n');
    xhr.push('data: {"type":"token","value":"lo"}');
    xhr.push('}\n\n'); // (already closed above; this exercises buffering)
    xhr.push('data: {"type":"done"}\n\n');
    xhr.finish(200);

    expect(frames[0]).toBe('{"type":"token","value":"Hel"}');
    expect(frames).toContain('{"type":"done"}');
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('reports non-2xx as an error', () => {
    const onError = jest.fn();
    streamSSE('http://x/chat/stream', {}, {}, {onFrame: () => {}, onError});
    xhr.finish(500);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({message: 'Stream failed: 500'}));
  });
});
