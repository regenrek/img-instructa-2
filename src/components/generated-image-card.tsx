import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Download, Sparkles } from 'lucide-react';
import type { HiDreamImage } from '~/lib/types/fal';

interface GeneratedImageCardProps {
  image: HiDreamImage;
  prompt: string;
  seed: number;
  onGenerateVideo: () => void;
  onRegenerate: () => void;
}

export function GeneratedImageCard({
  image,
  prompt,
  seed,
  onGenerateVideo,
  onRegenerate,
}: GeneratedImageCardProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${seed}.${image.content_type.includes('jpeg') ? 'jpg' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative">
          <img src={image.url} alt={prompt} className="w-full rounded-t-xl" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-xl">
            <div className="space-y-4">
              <div className="bg-purple-600/90 rounded-lg px-4 py-3 flex items-center justify-between">
                <p className="text-white font-medium">Perfect! Now bring your image to life.</p>
                <Button onClick={onGenerateVideo} size="sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Video
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 flex items-center justify-between border-t">
          <div className="text-sm text-muted-foreground">Seed: {seed}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
