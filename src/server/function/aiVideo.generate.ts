import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { env } from '~/env/server';
import { initFalClient, subscribeWithProgress } from '~/lib/fal';
import { mapFalError } from '~/lib/errors';
import type { MiniMaxInput, MiniMaxOutput } from '~/lib/types/fal';

// Initialize FAL client once
let falInitialized = false;
function ensureFalInitialized() {
  if (!falInitialized) {
    initFalClient(env.FAL_KEY);
    falInitialized = true;
  }
}

const generateVideoSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(500),
  image_url: z
    .string()
    .url('Valid image URL is required')
    .refine((url) => url.startsWith('https://'), {
      message: 'Image URL must use HTTPS',
    }),
  prompt_optimizer: z.boolean().optional().default(true),
  duration: z.enum(['6', '10']).optional().default('6'),
});

export const generateVideo = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return generateVideoSchema.parse(data);
  })
  .handler(async ({ data }) => {
    try {
      ensureFalInitialized();

      const input = {
        prompt: data.prompt,
        image_url: data.image_url,
        prompt_optimizer: data.prompt_optimizer,
        duration: data.duration,
      } as Record<string, unknown>;

      const result = await subscribeWithProgress<MiniMaxOutput>(
        'fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video',
        input,
      );

      return {
        success: true,
        data: {
          video: result.video,
        },
        error: null,
      } as const;
    } catch (error) {
      const mappedError = mapFalError(error);
      return {
        success: false,
        error: mappedError.name,
        message: mappedError.message,
        data: null,
      } as const;
    }
  });

