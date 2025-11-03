export class FalApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'FalApiError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NsfwDetectedError extends Error {
  constructor(message = 'NSFW content detected') {
    super(message);
    this.name = 'NsfwDetectedError';
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export function mapFalError(error: unknown): Error {
  if (error instanceof Error) {
    // Check for known error patterns
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return new RateLimitError(error.message);
    }
    if (error.message.includes('NSFW') || error.message.includes('nsfw')) {
      return new NsfwDetectedError(error.message);
    }
    if (error.message.includes('validation') || error.message.includes('400')) {
      return new ValidationError(error.message);
    }
    return error;
  }
  return new Error('Unknown error occurred');
}

