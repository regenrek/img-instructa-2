/**
 * Style Registry for predefined style presets
 * Styles are composable and model-aware with model-specific overrides
 */

import type { ModelId } from './models';

export type StyleId =
  | 'none'
  | 'photorealistic'
  | 'anime'
  | 'cinematic'
  | 'oil-painting'
  | 'watercolor'
  | 'sketch'
  | 'cyberpunk'
  | 'minimalist'
  | 'vintage';

export interface StyleConfig {
  id: StyleId;
  name: string;
  description: string;
  /** Text to prepend to the user prompt */
  promptPrefix?: string;
  /** Text to append to the user prompt */
  promptSuffix?: string;
  /** Additional negative prompt terms */
  negativePromptAdditions?: string;
  /** Model-specific overrides */
  modelSpecific?: Partial<Record<ModelId, StyleConfig>>;
}

export const PREDEFINED_STYLES: Record<StyleId, StyleConfig> = {
  none: {
    id: 'none',
    name: 'None',
    description: 'No style preset applied',
    promptPrefix: '',
    promptSuffix: '',
  },
  photorealistic: {
    id: 'photorealistic',
    name: 'Photorealistic',
    description: 'Hyper-realistic, high-detail photographic style',
    promptPrefix: 'photorealistic, highly detailed, professional photography, ',
    promptSuffix: ', sharp focus, 8k uhd, dslr, soft lighting, high quality, film grain',
    negativePromptAdditions: 'cartoon, drawing, painting, sketch, illustration',
  },
  anime: {
    id: 'anime',
    name: 'Anime',
    description: 'Japanese anime and manga style',
    promptPrefix: 'anime style, ',
    promptSuffix: ', vibrant colors, detailed, high quality anime artwork, manga style',
    negativePromptAdditions: 'realistic, photorealistic, 3d render',
  },
  cinematic: {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Movie-like cinematic atmosphere',
    promptPrefix: 'cinematic, movie still, ',
    promptSuffix: ', dramatic lighting, film grain, anamorphic lens, bokeh, depth of field',
    negativePromptAdditions: 'flat lighting, amateur photography',
  },
  'oil-painting': {
    id: 'oil-painting',
    name: 'Oil Painting',
    description: 'Classic oil painting style',
    promptPrefix: 'oil painting, ',
    promptSuffix: ', brushstrokes, canvas texture, rich colors, classical art style',
    negativePromptAdditions: 'digital art, 3d render, photography',
  },
  watercolor: {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft watercolor painting style',
    promptPrefix: 'watercolor painting, ',
    promptSuffix: ', soft edges, flowing colors, paper texture, artistic',
    negativePromptAdditions: 'sharp edges, digital, 3d',
  },
  sketch: {
    id: 'sketch',
    name: 'Sketch',
    description: 'Pencil or charcoal sketch style',
    promptPrefix: 'pencil sketch, ',
    promptSuffix: ', line art, detailed sketch, high contrast, black and white',
    negativePromptAdditions: 'color, painting, 3d render',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Futuristic cyberpunk aesthetic',
    promptPrefix: 'cyberpunk style, neon lights, ',
    promptSuffix: ', futuristic, sci-fi, urban decay, vibrant neon, rain, night scene',
    negativePromptAdditions: 'natural lighting, daylight, countryside',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, simple, minimal design',
    promptPrefix: 'minimalist, clean, simple, ',
    promptSuffix: ', geometric shapes, negative space, flat colors, modern design',
    negativePromptAdditions: 'cluttered, detailed, complex, busy',
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    description: 'Retro, vintage, nostalgic style',
    promptPrefix: 'vintage, retro, ',
    promptSuffix: ', aged, nostalgic, film photography, vintage color grading',
    negativePromptAdditions: 'modern, contemporary, high tech',
  },
} as const satisfies Record<StyleId, StyleConfig>;

export const DEFAULT_STYLE_ID: StyleId = 'none';

/**
 * Get style configuration by ID
 * @throws {Error} if style ID is invalid
 */
export function getStyle(id: StyleId): StyleConfig {
  const style = PREDEFINED_STYLES[id];
  if (!style) {
    throw new Error(`Invalid style ID: ${id}`);
  }
  return style;
}

/**
 * Get all available style IDs
 */
export function getStyleIds(): StyleId[] {
  return Object.keys(PREDEFINED_STYLES) as StyleId[];
}

export interface AppliedStyle {
  prompt: string;
  negativePrompt: string;
}

/**
 * Apply a style to a user prompt
 * This is a pure function that deterministically composes the prompt
 * 
 * @param userPrompt - The user's input prompt
 * @param styleId - The style ID to apply (defaults to 'none')
 * @param modelId - The model ID for model-specific overrides
 * @param currentNegativePrompt - Existing negative prompt to extend
 * @returns Composed prompt and negative prompt
 */
export function applyStyle(
  userPrompt: string,
  styleId: StyleId = DEFAULT_STYLE_ID,
  modelId: ModelId,
  currentNegativePrompt: string = '',
): AppliedStyle {
  const style = getStyle(styleId);
  
  // Check for model-specific overrides
  const modelOverride = style.modelSpecific?.[modelId];
  const effectiveStyle = modelOverride || style;

  // Compose prompt
  const prefix = effectiveStyle.promptPrefix || '';
  const suffix = effectiveStyle.promptSuffix || '';
  const composedPrompt = `${prefix}${userPrompt.trim()}${suffix}`.trim();

  // Compose negative prompt
  const negativeAdditions = effectiveStyle.negativePromptAdditions || '';
  const composedNegativePrompt = [currentNegativePrompt.trim(), negativeAdditions]
    .filter(Boolean)
    .join(', ')
    .trim();

  return {
    prompt: composedPrompt,
    negativePrompt: composedNegativePrompt,
  };
}

