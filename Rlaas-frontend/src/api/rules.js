import { apiRequest } from './client';

export function listRules() {
  return apiRequest('/rules/');
}

export function getRule(ruleId) {
  return apiRequest(`/rules/${encodeURIComponent(ruleId)}`);
}

export function createRule(payload) {
  return apiRequest('/rules/', {
    method: 'POST',
    body: payload,
  });
}

export function replaceRule(ruleId, payload) {
  return apiRequest(`/rules/${encodeURIComponent(ruleId)}`, {
    method: 'PUT',
    body: payload,
  });
}

export function patchRule(ruleId, payload) {
  return apiRequest(`/rules/${encodeURIComponent(ruleId)}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteRule(ruleId) {
  return apiRequest(`/rules/${encodeURIComponent(ruleId)}`, {
    method: 'DELETE',
  });
}
