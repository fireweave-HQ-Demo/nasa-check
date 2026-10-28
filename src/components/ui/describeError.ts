import { NasaApiError } from '@/lib/nasa';

export function describeError(error: unknown): { title: string; message: string } {
  if (error instanceof NasaApiError) {
    switch (error.kind) {
      case 'rate_limited':
        return {
          title: 'NASA rate limit reached',
          message:
            'Too many requests for this API key right now. Wait a few minutes, or set a personal key (VITE_NASA_API_KEY) instead of DEMO_KEY.',
        };
      case 'invalid_key':
        return {
          title: 'NASA API key rejected',
          message: 'Check VITE_NASA_API_KEY in your environment.',
        };
      case 'not_found':
        return {
          title: 'Nothing here',
          message: error.message || 'NASA has no entry for this request.',
        };
      case 'bad_request':
        return { title: 'NASA could not handle that request', message: error.message };
      case 'timeout':
      case 'network':
        return { title: 'Could not reach NASA', message: error.message };
      default:
        return { title: 'NASA is having trouble', message: 'Please try again in a moment.' };
    }
  }
  return { title: 'Something went wrong', message: 'Please try again.' };
}
