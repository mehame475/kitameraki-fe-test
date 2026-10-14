export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export interface HttpClient {
  request<T>(path: string, method: string, body?: unknown): Promise<T>;
}

// Turns the API's `{ error: { message, details } }` payload into a readable message
async function readError(res: Response): Promise<string> {
  try {
    const { error } = (await res.json()) as { error?: { message?: string; details?: string[] } };
    if (error?.message) return [error.message, ...(error.details ?? [])].join(' — ');
  } catch {
    /* non-JSON error body */
  }
  return `Request failed (${res.status})`;
}

function createHttpClient(): HttpClient | undefined {
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (!baseUrl) return undefined; // no API configured: services fall back to the local mock

  const organizationId = import.meta.env.VITE_ORGANIZATION_ID;
  if (!organizationId) {
    throw new Error('VITE_ORGANIZATION_ID is required when VITE_API_URL is set (see .env.example).');
  }
  const functionKey = import.meta.env.VITE_API_KEY;

  return {
    async request<T>(path: string, method: string, body?: unknown): Promise<T> {
      const headers: Record<string, string> = { 'x-organization-id': organizationId };
      if (functionKey) headers['x-functions-key'] = functionKey;
      if (body !== undefined) headers['Content-Type'] = 'application/json';

      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) throw new HttpError(res.status, await readError(res));
      return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
    },
  };
}

// Shared by all API services; `undefined` when VITE_API_URL is not set
export const http = createHttpClient();
