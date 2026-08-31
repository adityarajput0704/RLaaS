import { apiRequest } from './client';

export function getAppStats() {
  return apiRequest('/stats');
}