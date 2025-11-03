import { useState, startTransition } from 'react';
import { generateImage } from '~/server/function/aiImage.generate';
import { generateVideo } from '~/server/function/aiVideo.generate';
import type { HiDreamImage, ModelOutput } from '~/lib/types/fal';
import { ImagePromptForm } from '~/components/image-prompt-form';
import { GenerationProgress } from '~/components/generation-progress';
import { GeneratedImageCard } from '~/components/generated-image-card';
import { GeneratedVideoCard } from '~/components/generated-video-card';
import { ErrorCallout } from '~/components/error-callout';
import type { QueueUpdate } from '~/lib/types/fal';
import type { ModelId } from '~/lib/config/models';
import type { StyleId } from '~/lib/config/styles';
import { Route } from '~/routes/(app)/image-gen';
import { getDefaultModel, DEFAULT_MODEL_ID } from '~/lib/config/models';
import { DEFAULT_STYLE_ID } from '~/lib/config/styles';

type GenerationState =
  | { type: 'idle' }
  | { type: 'generating_image'; progress?: QueueUpdate; requestId?: string }
  | {
      type: 'image_success';
      images: Array<{ url: string; width: number; height: number; content_type?: string }>;
      prompt: string;
      seed?: number;
    }
  | { type: 'image_error'; error: string }
  | {
      type: 'generating_video';
      imageUrl: string;
      prompt: string;
      progress?: QueueUpdate;
    }
  | {
      type: 'video_success';
      videoUrl: string;
      imageUrl: string;
      prompt: string;
    }
  | { type: 'video_error'; error: string; imageUrl: string };

export function AiImageGenerator() {
  const search = Route.useSearch();
  const defaultModel = getDefaultModel();

  const [state, setState] = useState<GenerationState>({ type: 'idle' });
  const [formData, setFormData] = useState<{
    prompt: string;
    negative_prompt: string;
    model_id: ModelId;
    style_id: StyleId;
    width: number;
    height: number;
    steps: number;
  }>({
    prompt: '',
    negative_prompt: '',
    model_id: (search.model as ModelId | undefined) || DEFAULT_MODEL_ID,
    style_id: (search.style as StyleId | undefined) || DEFAULT_STYLE_ID,
    width: search.w || defaultModel.defaultParams.width,
    height: search.h || defaultModel.defaultParams.height,
    steps: search.steps || defaultModel.defaultParams.num_inference_steps,
  });

  const handleGenerateImage = async (data: typeof formData) => {
    // Generate request ID for cancellation tracking
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    setState({ type: 'generating_image', requestId });
    setFormData(data);

    try {
      const result = await generateImage({
        data: {
          model_id: data.model_id,
          prompt: data.prompt,
          negative_prompt: data.negative_prompt || undefined,
          style_id: data.style_id,
          width: data.width,
          height: data.height,
          steps: data.steps,
          requestId,
        },
      });

      // Check if this request was superseded by reading current state
      setState((currentState) => {
        if (currentState.type === 'generating_image' && currentState.requestId !== requestId) {
          return currentState; // Keep current state, ignore late response
        }

        if (!result.success || !result.data) {
          return {
            type: 'image_error',
            error: result.message || 'Failed to generate image',
          };
        }

        if (result.error === 'NSFW_CONTENT_DETECTED') {
          return {
            type: 'image_error',
            error: 'NSFW content detected. Please try a different prompt.',
          };
        }

        return {
          type: 'image_success',
          images: result.data.images,
          prompt: result.data.prompt,
          seed: result.data.seed,
        };
      });
    } catch (error) {
      // Check if this request was superseded by reading current state
      setState((currentState) => {
        if (currentState.type === 'generating_image' && currentState.requestId !== requestId) {
          return currentState; // Keep current state, ignore late response
        }

        return {
          type: 'image_error',
          error: error instanceof Error ? error.message : 'Failed to generate image',
        };
      });
    }
  };

  const handleGenerateVideo = async (imageUrl: string, prompt: string) => {
    if (state.type !== 'image_success') return;

    const currentImageUrl = state.images[0]?.url || imageUrl;

    startTransition(() => {
      setState({
        type: 'generating_video',
        imageUrl: currentImageUrl,
        prompt,
      });
    });

    try {
      const result = await generateVideo({
        data: {
          prompt,
          image_url: imageUrl,
        },
      });

      if (!result.success || !result.data) {
        setState({
          type: 'video_error',
          error: result.message || 'Failed to generate video',
          imageUrl: currentImageUrl,
        });
        return;
      }

      setState({
        type: 'video_success',
        videoUrl: result.data.video.url,
        imageUrl: currentImageUrl,
        prompt,
      });
    } catch (error) {
      setState({
        type: 'video_error',
        error: error instanceof Error ? error.message : 'Failed to generate video',
        imageUrl: currentImageUrl,
      });
    }
  };

  const handleStartNewSession = () => {
    startTransition(() => {
      setState({ type: 'idle' });
      const defaultModel = getDefaultModel();
      setFormData({
        prompt: '',
        negative_prompt: '',
        model_id: DEFAULT_MODEL_ID,
        style_id: DEFAULT_STYLE_ID,
        width: defaultModel.defaultParams.width,
        height: defaultModel.defaultParams.height,
        steps: defaultModel.defaultParams.num_inference_steps,
      });
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {state.type === 'idle' && (
          <ImagePromptForm onSubmit={handleGenerateImage} initialData={formData} />
        )}

        {state.type === 'generating_image' && (
          <>
            <ImagePromptForm onSubmit={handleGenerateImage} initialData={formData} disabled />
            <div className="bg-white border rounded-xl p-8 min-h-[512px] flex items-center justify-center">
              <GenerationProgress message="Generating your image..." />
            </div>
          </>
        )}

        {state.type === 'image_success' && (
          <>
            <GeneratedImageCard
              image={state.images[0] as HiDreamImage}
              prompt={state.prompt}
              seed={state.seed || 0}
              onGenerateVideo={() => handleGenerateVideo(state.images[0].url, state.prompt)}
              onRegenerate={() => handleGenerateImage(formData)}
            />
            <ImagePromptForm onSubmit={handleGenerateImage} initialData={formData} />
          </>
        )}

        {state.type === 'image_error' && (
          <>
            <div className="bg-white border rounded-xl p-8 min-h-[512px] flex items-center justify-center">
              <div className="text-muted-foreground text-lg">IMAGE PLACEHOLDER</div>
            </div>
            <ErrorCallout message={state.error} onRetry={() => handleGenerateImage(formData)} />
            <ImagePromptForm onSubmit={handleGenerateImage} initialData={formData} />
          </>
        )}

        {state.type === 'generating_video' && (
          <div className="relative">
            <img src={state.imageUrl} alt="Generated" className="w-full rounded-xl" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
              <GenerationProgress message="Generating video..." />
            </div>
          </div>
        )}

        {state.type === 'video_success' && (
          <GeneratedVideoCard
            videoUrl={state.videoUrl}
            imageUrl={state.imageUrl}
            onStartNewSession={handleStartNewSession}
          />
        )}

        {state.type === 'video_error' && (
          <>
            <div className="relative">
              <img src={state.imageUrl} alt="Generated" className="w-full rounded-xl" />
            </div>
            <ErrorCallout
              message={state.error}
              onRetry={() => handleGenerateVideo(state.imageUrl, formData.prompt)}
            />
          </>
        )}
      </div>
    </div>
  );
}
