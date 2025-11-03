/**
 * Model Registry for fal.ai image generation models
 * Each model defines its capabilities, constraints, and default parameters
 */

export type ModelId =
  | 'fal-ai/hidream-i1-fast'
  | 'fal-ai/flux/schnell'
  | 'fal-ai/flux/dev'
  | 'fal-ai/flux-pro/v1-3'
  | 'fal-ai/stable-diffusion-v3-medium';

export interface ModelCapabilities {
  /** Whether the model requires square images only */
  requiresSquare?: boolean;
  /** Whether the model supports guidance_scale parameter */
  supportsGuidanceScale?: boolean;
  /** Whether the model supports num_images parameter */
  supportsMultipleImages?: boolean;
  /** Whether the model supports negative prompts */
  supportsNegativePrompt?: boolean;
}

export interface ModelConfig {
  id: ModelId;
  name: string;
  description: string;
  category: 'fast' | 'quality' | 'balanced';
  /** Whether this model supports style presets */
  supportsStyles: boolean;
  /** Default parameters for this model */
  defaultParams: {
    num_inference_steps: number;
    width: number;
    height: number;
    guidance_scale?: number;
  };
  /** Supported sizes for this model */
  supportedSizes: Array<{ width: number; height: number; label?: string }>;
  /** Maximum inference steps allowed */
  maxSteps: number;
  /** Model-specific capabilities and constraints */
  capabilities?: ModelCapabilities;
}

export const AVAILABLE_MODELS: Record<ModelId, ModelConfig> = {
  'fal-ai/hidream-i1-fast': {
    id: 'fal-ai/hidream-i1-fast',
    name: 'HiDream I1 Fast',
    description: 'Fast, high-quality image generation with good detail',
    category: 'fast',
    supportsStyles: true,
    defaultParams: {
      num_inference_steps: 16,
      width: 1024,
      height: 1024,
    },
    supportedSizes: [
      { width: 512, height: 512, label: '512x512' },
      { width: 768, height: 768, label: '768x768' },
      { width: 1024, height: 1024, label: '1024x1024' },
      { width: 1024, height: 1536, label: '1024x1536 (Portrait)' },
      { width: 1536, height: 1024, label: '1536x1024 (Landscape)' },
    ],
    maxSteps: 50,
    capabilities: {
      supportsNegativePrompt: true,
      supportsMultipleImages: true,
    },
  },
  'fal-ai/flux/schnell': {
    id: 'fal-ai/flux/schnell',
    name: 'Flux Schnell',
    description: 'Very fast generation with good quality, optimized for speed',
    category: 'fast',
    supportsStyles: true,
    defaultParams: {
      num_inference_steps: 4,
      width: 1024,
      height: 1024,
    },
    supportedSizes: [
      { width: 1024, height: 1024, label: '1024x1024' },
      { width: 1024, height: 1408, label: '1024x1408 (Portrait)' },
      { width: 1408, height: 1024, label: '1408x1024 (Landscape)' },
    ],
    maxSteps: 30,
    capabilities: {
      supportsGuidanceScale: true,
      supportsNegativePrompt: true,
    },
  },
  'fal-ai/flux/dev': {
    id: 'fal-ai/flux/dev',
    name: 'Flux Dev',
    description: 'Balanced quality and speed, great for general use',
    category: 'balanced',
    supportsStyles: true,
    defaultParams: {
      num_inference_steps: 28,
      width: 1024,
      height: 1024,
    },
    supportedSizes: [
      { width: 1024, height: 1024, label: '1024x1024' },
      { width: 1024, height: 1408, label: '1024x1408 (Portrait)' },
      { width: 1408, height: 1024, label: '1408x1024 (Landscape)' },
    ],
    maxSteps: 50,
    capabilities: {
      supportsGuidanceScale: true,
      supportsNegativePrompt: true,
    },
  },
  'fal-ai/flux-pro/v1-3': {
    id: 'fal-ai/flux-pro/v1-3',
    name: 'Flux Pro',
    description: 'Highest quality generation with advanced features',
    category: 'quality',
    supportsStyles: true,
    defaultParams: {
      num_inference_steps: 28,
      width: 1024,
      height: 1024,
    },
    supportedSizes: [
      { width: 1024, height: 1024, label: '1024x1024' },
      { width: 1024, height: 1408, label: '1024x1408 (Portrait)' },
      { width: 1408, height: 1024, label: '1408x1024 (Landscape)' },
    ],
    maxSteps: 50,
    capabilities: {
      supportsGuidanceScale: true,
      supportsNegativePrompt: true,
    },
  },
  'fal-ai/stable-diffusion-v3-medium': {
    id: 'fal-ai/stable-diffusion-v3-medium',
    name: 'Stable Diffusion 3 Medium',
    description: 'High-quality, versatile generation model',
    category: 'balanced',
    supportsStyles: true,
    defaultParams: {
      num_inference_steps: 28,
      width: 1024,
      height: 1024,
    },
    supportedSizes: [
      { width: 1024, height: 1024, label: '1024x1024' },
      { width: 1024, height: 1536, label: '1024x1536 (Portrait)' },
      { width: 1536, height: 1024, label: '1536x1024 (Landscape)' },
    ],
    maxSteps: 50,
    capabilities: {
      supportsNegativePrompt: true,
    },
  },
};

export const DEFAULT_MODEL_ID: ModelId = 'fal-ai/hidream-i1-fast';

/**
 * Get model configuration by ID
 * @throws {Error} if model ID is invalid
 */
export function getModel(id: ModelId): ModelConfig {
  const model = AVAILABLE_MODELS[id];
  if (!model) {
    throw new Error(`Invalid model ID: ${id}`);
  }
  return model;
}

/**
 * Get all available model IDs
 */
export function getModelIds(): ModelId[] {
  return Object.keys(AVAILABLE_MODELS) as ModelId[];
}

/**
 * Get default model configuration
 */
export function getDefaultModel(): ModelConfig {
  return getModel(DEFAULT_MODEL_ID);
}
