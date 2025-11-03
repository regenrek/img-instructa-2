import { useState, FormEvent, useMemo, useEffect, startTransition } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { getModelIds, getModel, DEFAULT_MODEL_ID, type ModelId } from '~/lib/config/models';
import { getStyleIds, DEFAULT_STYLE_ID, type StyleId, PREDEFINED_STYLES } from '~/lib/config/styles';
import { Route } from '~/routes/(app)/image-gen';

interface ImagePromptFormProps {
  onSubmit: (data: {
    prompt: string;
    negative_prompt: string;
    model_id: ModelId;
    style_id: StyleId;
    width: number;
    height: number;
    steps: number;
  }) => void;
  initialData?: {
    prompt: string;
    negative_prompt: string;
    model_id: ModelId;
    style_id: StyleId;
    width: number;
    height: number;
    steps: number;
  };
  disabled?: boolean;
}

export function ImagePromptForm({
  onSubmit,
  initialData,
  disabled = false,
}: ImagePromptFormProps) {
  const navigate = useNavigate();
  const search = Route.useSearch();
  
  // Get model and style from URL or defaults
  const modelId = (search.model as ModelId | undefined) || initialData?.model_id || DEFAULT_MODEL_ID;
  const styleId = (search.style as StyleId | undefined) || initialData?.style_id || DEFAULT_STYLE_ID;
  const model = getModel(modelId);
  
  // Get size from URL or defaults
  const defaultWidth = search.w || initialData?.width || model.defaultParams.width;
  const defaultHeight = search.h || initialData?.height || model.defaultParams.height;
  const defaultSteps = search.steps || initialData?.steps || model.defaultParams.num_inference_steps;

  const [prompt, setPrompt] = useState(initialData?.prompt || '');
  const [negativePrompt, setNegativePrompt] = useState(initialData?.negative_prompt || '');
  const [width, setWidth] = useState(defaultWidth.toString());
  const [height, setHeight] = useState(defaultHeight.toString());
  const [steps, setSteps] = useState(defaultSteps.toString());

  // Update local state when URL changes
  const currentModel = (search.model as ModelId | undefined) || modelId;
  const currentStyle = (search.style as StyleId | undefined) || styleId;
  const currentWidth = search.w || defaultWidth;
  const currentHeight = search.h || defaultHeight;
  const currentSteps = search.steps || defaultSteps;

  // Sync local state with URL when model/size/steps change
  useEffect(() => {
    setWidth(currentWidth.toString());
    setHeight(currentHeight.toString());
    setSteps(currentSteps.toString());
  }, [currentModel, currentWidth, currentHeight, currentSteps]);

  // Get available sizes for current model
  const availableSizes = useMemo(() => model.supportedSizes, [model]);

  // Max steps for current model
  const maxSteps = model.maxSteps;

  const handleModelChange = (newModelId: ModelId) => {
    const newModel = getModel(newModelId);
    const newWidth = newModel.defaultParams.width;
    const newHeight = newModel.defaultParams.height;
    const newSteps = newModel.defaultParams.num_inference_steps;

    setWidth(newWidth.toString());
    setHeight(newHeight.toString());
    setSteps(newSteps.toString());

    startTransition(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          model: newModelId,
          w: newWidth,
          h: newHeight,
          steps: newSteps,
        }),
      });
    });
  };

  const handleStyleChange = (newStyleId: StyleId) => {
    startTransition(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          style: newStyleId,
        }),
      });
    });
  };

  const handleSizeChange = (newWidth: number, newHeight: number) => {
    setWidth(newWidth.toString());
    setHeight(newHeight.toString());
    startTransition(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          w: newWidth,
          h: newHeight,
        }),
      });
    });
  };

  const handleStepsChange = (newSteps: string) => {
    setSteps(newSteps);
    const stepsNum = parseInt(newSteps, 10);
    if (!isNaN(stepsNum)) {
      startTransition(() => {
        navigate({
          search: (prev) => ({
            ...prev,
            steps: Math.min(Math.max(1, stepsNum), maxSteps),
          }),
        });
      });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled || !prompt.trim()) return;

    onSubmit({
      prompt: prompt.trim(),
      negative_prompt: negativePrompt.trim(),
      model_id: currentModel,
      style_id: currentStyle,
      width: parseInt(width, 10) || model.defaultParams.width,
      height: parseInt(height, 10) || model.defaultParams.height,
      steps: parseInt(steps, 10) || model.defaultParams.num_inference_steps,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/' && e.target === e.currentTarget) {
      e.preventDefault();
      (e.currentTarget as HTMLTextAreaElement).focus();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Image</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
              value={currentModel}
              onValueChange={handleModelChange}
              disabled={disabled}
            >
              <SelectTrigger id="model" aria-describedby="model-description" className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {getModelIds().map((id) => {
                  const m = getModel(id);
                  return (
                    <SelectItem key={id} value={id}>
                      {m.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p id="model-description" className="text-xs text-muted-foreground">
              {model.description}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Select
              value={currentStyle}
              onValueChange={handleStyleChange}
              disabled={disabled || !model.supportsStyles}
            >
              <SelectTrigger id="style" aria-describedby="style-description" className="w-full">
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {getStyleIds().map((id) => {
                  const s = PREDEFINED_STYLES[id];
                  return (
                    <SelectItem key={id} value={id}>
                      {s.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p id="style-description" className="text-xs text-muted-foreground">
              {!model.supportsStyles
                ? 'This model does not support style presets'
                : `Style: ${PREDEFINED_STYLES[currentStyle].description}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Create an avatar of myself in a medieval kingdom style."
              disabled={disabled}
              rows={3}
              required
              aria-describedby="prompt-description"
            />
            <p id="prompt-description" className="text-xs text-muted-foreground">
              Press / to focus, Cmd/Ctrl + Enter to generate
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="negative_prompt">Negative Prompt (Optional)</Label>
            <Textarea
              id="negative_prompt"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, low quality, distorted..."
              disabled={disabled || !model.capabilities?.supportsNegativePrompt}
              rows={2}
              aria-describedby="negative-prompt-description"
            />
            {!model.capabilities?.supportsNegativePrompt && (
              <p id="negative-prompt-description" className="text-xs text-muted-foreground">
                This model does not support negative prompts
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select
              value={`${width}x${height}`}
              onValueChange={(value) => {
                const [w, h] = value.split('x').map(Number);
                handleSizeChange(w, h);
              }}
              disabled={disabled}
            >
              <SelectTrigger id="size" className="w-full">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {availableSizes.map((size) => (
                  <SelectItem
                    key={`${size.width}x${size.height}`}
                    value={`${size.width}x${size.height}`}
                  >
                    {size.label || `${size.width}x${size.height}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => {
                  setWidth(e.target.value);
                  const w = parseInt(e.target.value, 10);
                  if (!isNaN(w)) {
                    handleSizeChange(w, parseInt(height, 10));
                  }
                }}
                disabled={disabled}
                min={256}
                max={2048}
                step={64}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  const h = parseInt(e.target.value, 10);
                  if (!isNaN(h)) {
                    handleSizeChange(parseInt(width, 10), h);
                  }
                }}
                disabled={disabled}
                min={256}
                max={2048}
                step={64}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps">Inference Steps</Label>
            <Input
              id="steps"
              type="number"
              value={steps}
              onChange={(e) => handleStepsChange(e.target.value)}
              disabled={disabled}
              min={1}
              max={maxSteps}
              aria-describedby="steps-description"
            />
            <p id="steps-description" className="text-xs text-muted-foreground">
              Max steps for {model.name}: {maxSteps}
            </p>
          </div>

          <Button type="submit" disabled={disabled || !prompt.trim()} className="w-full">
            {disabled ? 'Generating...' : 'Generate'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
