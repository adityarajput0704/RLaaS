import { apiRequest } from './client';

export function getSystemStatus() {
  return apiRequest('/', { auth: false });
}
