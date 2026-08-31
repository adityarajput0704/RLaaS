import { apiRequest } from './client';

export function registerApplication(name) {
  return apiRequest('/apps/', {
    method: 'POST',
    auth: false,
    body: { name },
  });
}

export function authenticateWithKey(apiKey) {
  return apiRequest('/auth-test', {
    apiKey,
    skipUnauthorizedHandler: true,
  });
}

export function rotateApiKey(apiKey) {
  return apiRequest('/apps/rotate-key', {
    method: 'POST',
    apiKey,
    skipUnauthorizedHandler: true,
  });
}

export function revokeApiKey() {
  return apiRequest('/apps/revoke-key', {
    method: 'POST',
  });
}
