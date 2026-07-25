import type { HTTPAdapter } from '@x402/core/server';

export class NextRequestAdapter implements HTTPAdapter {
  constructor(
    private readonly request: Request,
    private readonly body: unknown,
    private readonly url: URL,
  ) {}

  getHeader(name: string): string | undefined {
    return this.request.headers.get(name) ?? undefined;
  }

  getMethod(): string {
    return this.request.method;
  }

  getPath(): string {
    return this.url.pathname;
  }

  getUrl(): string {
    return this.url.toString();
  }

  getAcceptHeader(): string {
    return this.request.headers.get('Accept') ?? '';
  }

  getUserAgent(): string {
    return this.request.headers.get('User-Agent') ?? '';
  }

  getBody(): unknown {
    return this.body;
  }
}
