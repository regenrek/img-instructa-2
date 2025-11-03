import { fal } from '@fal-ai/client';
import type { QueueUpdate } from './types/fal';

// Initialize FAL client with API key from environment
// This should only be called on the server
export function initFalClient(apiKey: string) {
  fal.config({
    credentials: apiKey,
  });
}

// Common subscribe wrapper for queue-based operations
export async function subscribeWithProgress<T>(
  modelId: string,
  input: Record<string, unknown>,
  onProgress?: (update: QueueUpdate) => void,
): Promise<T> {
  const result = await fal.subscribe(modelId, {
    input,
    logs: true,
    onQueueUpdate: (update: any) => {
      if (onProgress) {
        const queueUpdate: QueueUpdate = {
          status: update.status as 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
          logs: (update.logs as Array<{ message?: string; level?: string }>)?.map((log) => ({
            message: log.message || '',
            level: log.level,
          })),
          progress: (update as any).progress,
          requestId: (update as any).request_id || (update as any).requestId,
        };
        onProgress(queueUpdate);
      }
    },
  });

  // FAL client returns { data: T, requestId: string }
  return (result as any).data as T;
}

