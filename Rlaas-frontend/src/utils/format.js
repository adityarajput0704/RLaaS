export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const ALGORITHMS = [
  { id: 'fixed_window', label: 'Fixed Window' },
  { id: 'sliding_window', label: 'Sliding Window' },
  { id: 'token_bucket', label: 'Token Bucket' },
];

export function algorithmLabel(id) {
  return ALGORITHMS.find((item) => item.id === id)?.label || id || 'N/A';
}

export function maskApiKey(key) {
  if (!key) return 'N/A';
  const prefix = key.startsWith('rlaas_') ? 'rlaas_' : key.slice(0, Math.min(6, key.length));
  return `${prefix}${'•'.repeat(16)}`;
}

export function buildRuleConfig(algorithm, fields) {
  if (algorithm === 'token_bucket') {
    return {
      capacity: Number(fields.capacity),
      refill_rate: Number(fields.refill_rate),
    };
  }
  return {
    limit: Number(fields.limit),
    window_size: Number(fields.window_size),
  };
}

export function formatExpiresAt(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export function blockRate({ allowed, blocked }) {
  const total = Number(allowed || 0) + Number(blocked || 0);
  if (!total) return '0.0%';
  return `${((Number(blocked || 0) / total) * 100).toFixed(1)}%`;
}
