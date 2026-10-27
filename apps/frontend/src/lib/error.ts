import axios from 'axios';

interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

/**
 * Type-safe error message extractor for Axios and general errors.
 * Strictly avoids unsafe `as Type` assertions.
 */
export function extractApiErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const apiMessage = error.response?.data?.message;
    if (typeof apiMessage === 'string') {
      return apiMessage;
    }
    if (Array.isArray(apiMessage) && apiMessage.length > 0) {
      return apiMessage.join(', ');
    }
    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
