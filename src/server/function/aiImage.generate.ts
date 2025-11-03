import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { env } from '~/env/server';
import { initFalClient, subscribeWithProgress } from '~/lib/fal';
import { mapFalError } from '~/lib/errors';
import type { HiDreamOutput, ModelOutput } from '~/lib/types/fal';
import { normalizeHiDreamOutput } from '~/lib/types/fal';
import { getModel, DEFAULT_MODEL_ID, type ModelId } from '~/lib/config/models';
import { applyStyle, DEFAULT_STYLE_ID, type StyleId } from '~/lib/config/styles';

// Initialize FAL client once
let falInitialized = false;
function ensureFalInitialized() {
  if (!falInitialized) {
    initFalClient(env.FAL_KEY);
    falInitialized = true;
  }
}

const generateImageSchema = z.object({
  model_id: z.string().min(1, 'Model ID is required'),
  prompt: z.string().min(1, 'Prompt is required').max(500),
  negative_prompt: z.string().max(500).optional(),
  style_id: z.string().optional(),
  steps: z.number().int().min(1).max(50).optional(),
  width: z.number().int().min(256).max(2048).optional(),
  height: z.number().int().min(256).max(2048).optional(),
  seed: z.number().int().optional(),
  requestId: z.string().optional(), // For cancellation tracking
});

export const generateImage = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return generateImageSchema.parse(data);
  })
  .handler(async ({ data }) => {
    try {
      ensureFalInitialized();

      // Validate and get model configuration
      const modelId = (data.model_id || DEFAULT_MODEL_ID) as ModelId;
      let model;
      try {
        model = getModel(modelId);
      } catch (error) {
        return {
          success: false,
          error: 'INVALID_MODEL',
          message: `Invalid model ID: ${modelId}`,
          data: null,
        } as const;
      }

      // Validate and apply style
      const styleId = (data.style_id || DEFAULT_STYLE_ID) as StyleId;
      const appliedStyle = applyStyle(
        data.prompt,
        styleId,
        modelId,
        data.negative_prompt || '',
      );

      // Get default params from model
      const defaultParams = model.defaultParams;

      // Validate and set steps (respect model max)
      const steps = data.steps
        ? Math.min(Math.max(1, data.steps), model.maxSteps)
        : defaultParams.num_inference_steps;

      // Validate and set size (check against supported sizes and model capabilities)
      let width = data.width || defaultParams.width;
      let height = data.height || defaultParams.height;

      // Check if model requires square
      if (model.capabilities?.requiresSquare && width !== height) {
        const size = Math.min(width, height);
        width = size;
        height = size;
      }

      // Validate size is in supported sizes (coerce to closest if needed)
      const sizeSupported = model.supportedSizes.some(
        (s) => s.width === width && s.height === height,
      );
      if (!sizeSupported && model.supportedSizes.length > 0) {
        // Use first supported size as fallback
        const fallbackSize = model.supportedSizes[0];
        width = fallbackSize.width;
        height = fallbackSize.height;
      }

      // Build input based on model-specific requirements
      const input: Record<string, unknown> = {
        prompt: appliedStyle.prompt,
      };

      // Add negative prompt if model supports it
      if (model.capabilities?.supportsNegativePrompt && appliedStyle.negativePrompt) {
        input.negative_prompt = appliedStyle.negativePrompt;
      }

      // Add size
      input.image_size = { width, height };

      // Add steps (model-specific field name)
      input.num_inference_steps = steps;

      // Add seed if provided
      if (data.seed !== undefined) {
        input.seed = data.seed;
      }

      // Add guidance scale if model supports it
      if (model.capabilities?.supportsGuidanceScale && defaultParams.guidance_scale) {
        input.guidance_scale = defaultParams.guidance_scale;
      }

      // Add model-specific defaults
      input.sync_mode = false;
      input.num_images = 1;
      input.enable_safety_checker = true;
      input.output_format = 'jpeg';

      // Call fal.ai with the specified model
      const result = await subscribeWithProgress<HiDreamOutput>(modelId, input);

      // Check for NSFW content (if present in result)
      if (
        'has_nsfw_concepts' in result &&
        Array.isArray(result.has_nsfw_concepts) &&
        result.has_nsfw_concepts.some((has) => has)
      ) {
        return {
          success: false,
          error: 'NSFW_CONTENT_DETECTED',
          message: 'Generated image contains NSFW content',
          data: null,
        } as const;
      }

      // Normalize output to ModelOutput format
      const normalizedOutput: ModelOutput = normalizeHiDreamOutput(result);

      return {
        success: true,
        data: {
          images: normalizedOutput.images,
          seed: normalizedOutput.seed,
          model_id: modelId,
          style_id: styleId,
          prompt: appliedStyle.prompt,
          negative_prompt: appliedStyle.negativePrompt,
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

