export class ApiError extends Error {
  constructor(message, { status = 0, retryAfter = null, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfter = retryAfter;
    this.data = data;
  }
}

export function messageForStatus(status) {
  if (status === 401) {
    return 'Your API key is invalid, expired, or revoked.';
  }
  if (status === 403) {
    return 'You are not authorized to access this resource.';
  }
  if (status === 404) {
    return 'Resource not found.';
  }
  if (status === 409) {
    return 'A rule already exists for this method and resource.';
  }
  if (status === 429) {
    return 'Too many requests. Please try again shortly.';
  }
  if (status === 400 || status === 413 || status === 422) {
    return 'Please check the submitted values.';
  }
  if (status >= 500) {
    return 'Something went wrong on the server.';
  }
  if (status >= 400) {
    return 'Please check the submitted values.';
  }
  return 'Something went wrong on the server.';
}
