import { ShieldApiError } from './errors.js';

export interface HttpTransport {
  baseUrl: string;
  apiKey?: string;
  fetch: typeof fetch;
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | undefined>,
): string {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function authHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

function parseErrorBody(body: unknown): { message: string; code?: string } {
  if (typeof body === 'object' && body) {
    const record = body as { message?: unknown; error?: unknown };
    const message =
      typeof record.message === 'string'
        ? record.message
        : typeof record.error === 'string'
          ? record.error
          : 'Request failed';
    const code = typeof record.error === 'string' ? record.error : undefined;
    return { message, code };
  }

  return { message: 'Request failed' };
}

export async function requestJson<T>(
  transport: HttpTransport,
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const headers = authHeaders(transport.apiKey);

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await transport.fetch(buildUrl(transport.baseUrl, path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const parsedBody = isJson ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    const { message, code } = parseErrorBody(parsedBody);
    throw new ShieldApiError(message, response.status, code, parsedBody);
  }

  return parsedBody as T;
}

export async function requestBuffer(
  transport: HttpTransport,
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string | undefined>,
): Promise<ArrayBuffer> {
  const headers = authHeaders(transport.apiKey);

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await transport.fetch(buildUrl(transport.baseUrl, path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    const parsedBody = contentType.includes('application/json')
      ? await response.json().catch(() => undefined)
      : undefined;
    const { message, code } = parseErrorBody(parsedBody);
    throw new ShieldApiError(message, response.status, code, parsedBody);
  }

  return response.arrayBuffer();
}
