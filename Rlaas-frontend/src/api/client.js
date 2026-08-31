import { ApiError, messageForStatus } from './errors';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(
  /\/$/,
  ''
);

const handlers = {
  getApiKey: () => null,
  onUnauthorized: () => {},
};

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function configureApiClient({ getApiKey, onUnauthorized }) {
  if (typeof getApiKey === 'function') {
    handlers.getApiKey = getApiKey;
  }
  if (typeof onUnauthorized === 'function') {
    handlers.onUnauthorized = onUnauthorized;
  }
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    query,
    apiKey,
    auth = true,
    skipUnauthorizedHandler = false,
    signal,
  } = options;

  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers = { Accept: 'application/json' };
  const resolvedKey = apiKey !== undefined ? apiKey : auth ? handlers.getApiKey() : null;

  if (auth) {
    if (!resolvedKey) {
      if (!skipUnauthorizedHandler) {
        handlers.onUnauthorized();
      }
      throw new ApiError(messageForStatus(401), { status: 401 });
    }
    headers['X-API-Key'] = resolvedKey;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    throw new ApiError('Unable to connect to RLaaS.', { status: 0 });
  }

  const payload = await parseBody(response);
  const retryAfter = response.headers.get('Retry-After');

  if (!response.ok) {
    if (response.status === 401 && !skipUnauthorizedHandler) {
      handlers.onUnauthorized();
    }

    throw new ApiError(messageForStatus(response.status), {
      status: response.status,
      retryAfter,
      data: payload,
    });
  }

  return {
    status: response.status,
    data: payload,
    headers: {
      retryAfter,
    },
  };
}
