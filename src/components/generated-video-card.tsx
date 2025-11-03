import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Download, Play, RotateCcw } from 'lucide-react';

interface GeneratedVideoCardProps {
  videoUrl: string;
  imageUrl: string;
  onStartNewSession: () => void;
}

export function GeneratedVideoCard({
  videoUrl,
  imageUrl,
  onStartNewSession,
}: GeneratedVideoCardProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download video:', error);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative">
          <video src={videoUrl} controls className="w-full rounded-t-xl" poster={imageUrl}>
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-green-600/10 border border-green-600/20 rounded-lg px-4 py-3">
            <p className="text-green-700 dark:text-green-400 font-medium">All done!</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download Video
            </Button>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Not happy?</p>
            <Button variant="outline" onClick={onStartNewSession} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Start a new session
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
