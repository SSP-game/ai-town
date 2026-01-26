import { sleep } from './sleep';

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 100,
    maxDelay = 2000,
    shouldRetry = (error) => {
      return (
        error?.message?.includes('OCC') ||
        error?.message?.includes('concurrency') ||
        error?.message?.includes('conflict')
      );
    },
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * delay * 0.1;
      await sleep(delay + jitter);
    }
  }

  throw lastError;
}
