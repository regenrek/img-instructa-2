import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { AiImageGenerator } from '~/components/ai-image-generator';
import { getModelIds, getDefaultModel, type ModelId } from '~/lib/config/models';
import { getStyleIds, type StyleId } from '~/lib/config/styles';

// Get max steps from default model for validation
const defaultModel = getDefaultModel();

// Create enum arrays for zod
const modelIds = getModelIds();
const styleIds = getStyleIds();

const searchSchema = z.object({
  model: z.enum(modelIds as [ModelId, ...ModelId[]]).optional(),
  style: z.enum(styleIds as [StyleId, ...StyleId[]]).optional(),
  steps: z.number().int().min(1).max(defaultModel.maxSteps).optional(),
  w: z.number().int().min(256).max(2048).optional(),
  h: z.number().int().min(256).max(2048).optional(),
});

export const Route = createFileRoute('/(app)/image-gen/')({
  validateSearch: searchSchema,
  component: AiImageGeneratorPage,
});

function AiImageGeneratorPage() {
  return <AiImageGenerator />;
}

