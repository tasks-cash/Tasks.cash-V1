import fs from "fs";
import path from "path";
import zlib from "zlib";
import { pipeline } from "stream/promises";
import { createReadStream, createWriteStream } from "fs";

/**
 * Daily rotating file sink with optional gzip of prior days.
 * No external dependencies — Docker-friendly when LOG_TO_FILE=true.
 */

export interface FileSinkOptions {
  dir: string;
  prefix: string;
  /** Keep rotated files for N days (default 14). */
  retentionDays: number;
  compress: boolean;
}

export class DailyRotatingFileSink {
  private stream: fs.WriteStream | null = null;
  private currentDate = "";
  private readonly opts: FileSinkOptions;
  private rotating = false;

  constructor(opts: Partial<FileSinkOptions> & { dir: string; prefix: string }) {
    this.opts = {
      retentionDays: opts.retentionDays ?? 14,
      compress: opts.compress ?? true,
      dir: opts.dir,
      prefix: opts.prefix,
    };
    try {
      fs.mkdirSync(this.opts.dir, { recursive: true });
    } catch {
      /* ignore */
    }
  }

  write(line: string): void {
    try {
      const date = new Date().toISOString().slice(0, 10);
      if (date !== this.currentDate) {
        this.rotate(date);
      }
      this.stream?.write(line + "\n");
    } catch {
      /* never throw from logging */
    }
  }

  private rotate(date: string): void {
    if (this.rotating) return;
    this.rotating = true;
    try {
      const prevDate = this.currentDate;
      if (this.stream) {
        try {
          this.stream.end();
        } catch {
          /* ignore */
        }
        this.stream = null;
      }
      if (prevDate && this.opts.compress) {
        void this.compressFile(prevDate);
      }
      const file = path.join(this.opts.dir, `${this.opts.prefix}-${date}.log`);
      this.stream = createWriteStream(file, { flags: "a" });
      this.currentDate = date;
      void this.prune();
    } finally {
      this.rotating = false;
    }
  }

  private async compressFile(date: string): Promise<void> {
    const src = path.join(this.opts.dir, `${this.opts.prefix}-${date}.log`);
    const dest = `${src}.gz`;
    if (!fs.existsSync(src) || fs.existsSync(dest)) return;
    try {
      await pipeline(createReadStream(src), zlib.createGzip(), createWriteStream(dest));
      fs.unlinkSync(src);
    } catch {
      /* ignore */
    }
  }

  private async prune(): Promise<void> {
    try {
      const files = fs.readdirSync(this.opts.dir);
      const cutoff = Date.now() - this.opts.retentionDays * 86_400_000;
      for (const name of files) {
        if (!name.startsWith(this.opts.prefix)) continue;
        const full = path.join(this.opts.dir, name);
        const stat = fs.statSync(full);
        if (stat.mtimeMs < cutoff) {
          try {
            fs.unlinkSync(full);
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  close(): void {
    try {
      this.stream?.end();
    } catch {
      /* ignore */
    }
    this.stream = null;
  }
}
