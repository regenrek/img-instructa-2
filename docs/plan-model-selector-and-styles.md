# Plan: Model Selector & Predefined Styles for fal.ai

## Overview

Add two key features to the AI image generator:
1. **Model Selector**: Allow users to choose from different fal.ai image generation models
2. **Predefined Styles**: Provide quick access to common style presets that enhance prompts

---

## 1. Model Selector Implementation

### 1.1 Create Model Configuration

**File**: `src/lib/config/models.ts`

Define available fal.ai models with their metadata:

```typescript
export interface ModelConfig {
  id: string;              // fal.ai model ID (e.g., 'fal-ai/hidream-i1-fast')
  name: string;            // Display name
  description: string;      // User-friendly description
  category: 'text-to-image' | 'other';
  supportsStyles: boolean; // Whether this model has built-in style support
  defaultParams?: {
    num_inference_steps?: number;
    image_size?: { width: number; height: number };
    // Model-specific defaults
  };
  supportedSizes?: Array<{ width: number; height: number; label?: string }>;
  maxSteps?: number;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'fal-ai/hidream-i1-fast',
    name: 'HiDream I1 Fast',
    description: 'Fast, high-quality 17B parameter model (16 steps default)',
    category: 'text-to-image',
    supportsStyles: false,
    defaultParams: {
      num_inference_steps: 16,
      image_size: { width: 1024, height: 1024 },
    },
    maxSteps: 50,
  },
  // Add more models:
  // - fal-ai/flux/schnell (fast)
  // - fal-ai/flux-pro/v1.1-ultra (high quality)
  // - fal-ai/recraft-v3 (with built-in styles)
  // etc.
];

export const DEFAULT_MODEL_ID = 'fal-ai/hidream-i1-fast';
```

### 1.2 Update Type Definitions

**File**: `src/lib/types/fal.ts`

- Extend `HiDreamInput` or create a generic `ImageGenerationInput`
- Add model-specific input types for different models
- Create a union type for model inputs

### 1.3 Update Server Function

**File**: `src/server/function/aiImage.generate.ts`

Changes:
- Add `model_id` to the input schema (zod validation)
- Make model ID dynamic instead of hardcoded
- Handle different model output types (may need type guards)
- Potentially normalize outputs to a common format

```typescript
const generateImageSchema = z.object({
  model_id: z.string().min(1, 'Model ID is required'),
  prompt: z.string().min(1).max(500),
  // ... rest of schema
});

// In handler:
const result = await subscribeWithProgress<ModelOutput>(
  data.model_id,  // Dynamic model ID
  input,
);
```

### 1.4 Update Form Component

**File**: `src/components/image-prompt-form.tsx`

Add model selector:
- Import model config
- Add `model_id` to form state
- Add select/dropdown component for model selection
- Show model description/help text
- Update form data interface

### 1.5 Update Main Component

**File**: `src/components/ai-image-generator.tsx`

- Add `model_id` to formData state
- Pass model_id to generateImage call
- Store selected model in state

---

## 2. Predefined Styles Implementation

### 2.1 Create Styles Configuration

**File**: `src/lib/config/styles.ts`

Define style presets with prompt modifiers:

```typescript
export interface StylePreset {
  id: string;
  name: string;
  description: string;
  promptPrefix?: string;     // Text to prepend to user prompt
  promptSuffix?: string;      // Text to append to user prompt
  negativePromptAdditions?: string; // Additions to negative prompt
  modelSpecific?: {
    // For models with built-in style support (e.g., Recraft V3)
    [modelId: string]: {
      style?: string;
      subcategory?: string;
      // Model-specific style parameters
    };
  };
}

export const PREDEFINED_STYLES: StylePreset[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No style applied',
  },
  {
    id: 'realistic',
    name: 'Realistic',
    description: 'Photorealistic style',
    promptPrefix: 'photorealistic, highly detailed, professional photography, ',
    negativePromptAdditions: 'cartoon, illustration, drawing, painting, ',
  },
  {
    id: 'digital-art',
    name: 'Digital Art',
    description: 'Modern digital artwork',
    promptPrefix: 'digital art, concept art, highly detailed, ',
    negativePromptAdditions: 'photorealistic, photo, ',
    modelSpecific: {
      'fal-ai/recraft-v3': {
        style: 'digital_illustration',
      },
    },
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Anime/manga style',
    promptPrefix: 'anime style, manga, cel-shaded, vibrant colors, ',
    negativePromptAdditions: 'realistic, photorealistic, ',
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    description: 'Classic oil painting style',
    promptPrefix: 'oil painting, classical art, detailed brushstrokes, ',
    negativePromptAdditions: 'digital, 3d, ',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Watercolor painting style',
    promptPrefix: 'watercolor painting, soft colors, artistic, ',
    negativePromptAdditions: 'sharp, high contrast, digital, ',
  },
  {
    id: 'sketch',
    name: 'Sketch',
    description: 'Pencil/charcoal sketch',
    promptPrefix: 'pencil sketch, charcoal drawing, detailed linework, ',
    negativePromptAdditions: 'color, painted, ',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon-lit futuristic style',
    promptPrefix: 'cyberpunk, neon lights, futuristic, sci-fi, ',
    negativePromptAdditions: 'natural lighting, vintage, ',
  },
  // Add more styles...
];

export const DEFAULT_STYLE_ID = 'none';

// Helper function to apply style to prompt
export function applyStyle(
  userPrompt: string,
  styleId: string,
  modelId: string,
  currentNegativePrompt?: string
): {
  enhancedPrompt: string;
  enhancedNegativePrompt: string;
} {
  const style = PREDEFINED_STYLES.find(s => s.id === styleId) || PREDEFINED_STYLES[0];
  
  let enhancedPrompt = userPrompt;
  if (style.promptPrefix) {
    enhancedPrompt = style.promptPrefix + userPrompt;
  }
  if (style.promptSuffix) {
    enhancedPrompt = enhancedPrompt + ', ' + style.promptSuffix;
  }
  
  let enhancedNegativePrompt = currentNegativePrompt || '';
  if (style.negativePromptAdditions) {
    enhancedNegativePrompt = style.negativePromptAdditions + enhancedNegativePrompt;
  }
  
  return {
    enhancedPrompt: enhancedPrompt.trim(),
    enhancedNegativePrompt: enhancedNegativePrompt.trim(),
  };
}
```

### 2.2 Update Form Component

**File**: `src/components/image-prompt-form.tsx`

Add style selector:
- Import styles config
- Add `style_id` to form state
- Add select component for style selection
- Show style preview/description
- Update form data interface

### 2.3 Apply Styles in Server Function

**File**: `src/server/function/aiImage.generate.ts`

- Import styles config and `applyStyle` helper
- Accept `style_id` in input schema
- Apply style transformations before sending to model
- Handle model-specific styles if needed

```typescript
// In handler, before creating input:
const { enhancedPrompt, enhancedNegativePrompt } = applyStyle(
  data.prompt,
  data.style_id || DEFAULT_STYLE_ID,
  data.model_id,
  data.negative_prompt
);

const input = {
  prompt: enhancedPrompt,
  negative_prompt: enhancedNegativePrompt,
  // ... rest
};
```

### 2.4 Update Main Component

**File**: `src/components/ai-image-generator.tsx`

- Add `style_id` to formData state
- Pass style_id to generateImage call

---

## 3. UI Components Needed

### 3.1 Select Component

We need a proper Select component (not just dropdown). Options:
- Install `@radix-ui/react-select` and create `src/components/ui/select.tsx`
- Or use the existing dropdown-menu (less ideal for this use case)

### 3.2 Form Layout Updates

Update `ImagePromptForm` to include:
- Model selector (top of form, prominent)
- Style selector (after prompt field, visible)
- Better visual grouping with cards/sections

---

## 4. Implementation Steps

### Phase 1: Model Selector
1. ✅ Create model config file
2. ✅ Update types
3. ✅ Update server function to accept dynamic model_id
4. ✅ Create/install Select UI component
5. ✅ Update form to include model selector
6. ✅ Update main component state
7. ✅ Test with multiple models

### Phase 2: Predefined Styles
1. ✅ Create styles config file
2. ✅ Create `applyStyle` helper function
3. ✅ Update server function to apply styles
4. ✅ Update form to include style selector
5. ✅ Update main component state
6. ✅ Test style application

### Phase 3: Polish & Enhancement
1. Add model descriptions/tooltips
2. Add style previews/thumbnails (future)
3. Allow custom style creation (future)
4. Model-specific parameter adjustments
5. Save user preferences to localStorage

---

## 5. Technical Considerations

### Model Compatibility
- Different models may have different:
  - Input parameters (some have `guidance_scale`, others don't)
  - Output formats
  - Supported sizes
  - Step ranges

**Solution**: Use type guards and conditional logic in server function, or create model-specific handlers.

### Style Application
- Styles applied via prompt modification work universally
- Some models (like Recraft V3) have built-in style parameters
- Need to handle both approaches

**Solution**: Check `modelSpecific` in style config and use appropriate method.

### Performance
- Model switching may require clearing current generation
- Style preview not implemented (would require generation)

### Error Handling
- Handle cases where model doesn't support certain parameters
- Validate model availability
- Graceful fallback if model fails

---

## 6. Future Enhancements

1. **Custom Styles**: Allow users to create and save custom style presets
2. **Style Mixing**: Combine multiple styles
3. **Model Recommendations**: Suggest best model for selected style
4. **Style Intensity**: Slider to control how strongly style is applied
5. **Style Library**: Browse/search community styles
6. **Style History**: Recently used styles

---

## 7. Files to Create/Modify

### New Files:
- `src/lib/config/models.ts`
- `src/lib/config/styles.ts`
- `src/components/ui/select.tsx` (if using Radix)

### Modified Files:
- `src/lib/types/fal.ts`
- `src/server/function/aiImage.generate.ts`
- `src/components/image-prompt-form.tsx`
- `src/components/ai-image-generator.tsx`

---

## 8. Testing Plan

1. Test model switching with different models
2. Test style application with various prompts
3. Test style + model combinations
4. Test edge cases (empty prompts, long prompts)
5. Test error handling for unsupported combinations
6. Verify prompt modifications don't break generation

