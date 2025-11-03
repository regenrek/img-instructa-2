import { Button } from '~/components/ui/button';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorCalloutProps {
  message: string;
  onRetry: () => void;
}

export function ErrorCallout({ message, onRetry }: ErrorCalloutProps) {
  return (
    <Alert variant="destructive" className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-red-900 dark:text-red-100">Oh no! Something went wrong!</p>
          {message && <p className="text-sm text-red-700 dark:text-red-300">{message}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

