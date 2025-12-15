// lib/logger.ts
export type LogEntry = { ts: number; tag: string; data?: unknown };

class RingLogger {
  private cap: number;
  private buf: LogEntry[];
  private start = 0;
  private len = 0;

  constructor(capacity = 200) {
    this.cap = Math.max(10, capacity);
    this.buf = new Array(this.cap);
  }

  add(tag: string, data?: unknown) {
    const i = (this.start + this.len) % this.cap;
    this.buf[i] = { ts: Date.now(), tag, data };
    if (this.len < this.cap) this.len++;
    else this.start = (this.start + 1) % this.cap;
  }

  list(): LogEntry[] {
    const out: LogEntry[] = [];
    for (let k = 0; k < this.len; k++) {
      const i = (this.start + this.len - 1 - k) % this.cap; // newest first
      out.push(this.buf[i]);
    }
    return out;
  }

  clear() {
    this.start = 0;
    this.len = 0;
  }
}

export const logger = new RingLogger(300);
export const log = (tag: string, data?: unknown) => logger.add(tag, data);
export default logger;
