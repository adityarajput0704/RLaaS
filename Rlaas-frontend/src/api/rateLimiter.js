import { apiRequest } from './client';
import { ApiError } from './errors';

export async function evaluateRateLimit({ userId, method, resource }) {
  try {
    const result = await apiRequest('/rate-limiter', {
      method: 'POST',
      body: {
        user_id: userId,
        method,
        resource,
      },
    });
    return {
      ok: true,
      status: result.status,
      data: result.data,
      retryAfter: result.headers.retryAfter,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        ok: false,
        status: error.status,
        data: error.data,
        message: error.message,
        retryAfter: error.retryAfter,
      };
    }
    throw error;
  }
}
