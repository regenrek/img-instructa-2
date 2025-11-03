export interface ImageSize {
  width: number;
  height: number;
}

export type OutputFormat = 'jpeg' | 'png';
export type VideoDuration = '6' | '10';

// HiDream I1 Fast Input
export interface HiDreamInput {
  prompt: string;
  negative_prompt?: string;
  image_size?: ImageSize;
  num_inference_steps?: number;
  seed?: number;
  sync_mode?: boolean;
  num_images?: number;
  enable_safety_checker?: boolean;
  output_format?: OutputFormat;
}

// HiDream I1 Fast Output
export interface HiDreamImage {
  url: string;
  content_type: string;
}

export interface HiDreamOutput {
  images: HiDreamImage[];
  prompt: string;
  seed: number;
  has_nsfw_concepts: boolean[];
  timings: {
    inference: number;
  };
}

// MiniMax Hailuo Input
export interface MiniMaxInput {
  prompt: string;
  image_url: string;
  prompt_optimizer?: boolean;
  duration?: VideoDuration;
}

// MiniMax Hailuo Output
export interface MiniMaxVideo {
  url: string;
}

export interface MiniMaxOutput {
  video: MiniMaxVideo;
}

// Queue update types
export interface QueueUpdate {
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  logs?: Array<{ message: string; level?: string }>;
  progress?: number;
  requestId?: string;
}

// Shared types for image generation

/**
 * Common input fields for image generation across models
 */
export interface ImageGenerationInput {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  seed?: number;
  guidance_scale?: number;
  num_images?: number;
}

/**
 * Normalized output shape for image generation
 * All models should map their outputs to this format
 */
export interface ModelOutput {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type?: string;
  }>;
  seed?: number;
  meta?: Record<string, unknown>;
}

/**
 * Type guard to check if output matches ModelOutput format
 */
export function isModelOutput(value: unknown): value is ModelOutput {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.images) &&
    obj.images.every(
      (img: unknown) =>
        typeof img === 'object' &&
        img !== null &&
        typeof (img as { url?: unknown }).url === 'string' &&
        typeof (img as { width?: unknown }).width === 'number' &&
        typeof (img as { height?: unknown }).height === 'number',
    )
  );
}

/**
 * Normalize HiDream output to ModelOutput
 */
export function normalizeHiDreamOutput(output: HiDreamOutput): ModelOutput {
  return {
    images: output.images.map((img) => ({
      url: img.url,
      width: 1024, // Default if not provided
      height: 1024,
      content_type: img.content_type,
    })),
    seed: output.seed,
    meta: {
      has_nsfw_concepts: output.has_nsfw_concepts,
      timings: output.timings,
      prompt: output.prompt,
    },
  };
}

