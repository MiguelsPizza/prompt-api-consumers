import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function WorkerErrorListener() {
  const { toast } = useToast();
  useEffect(() => {
    // Handle worker broadcast channel errors
    const channel = new BroadcastChannel('worker-errors');

    const handleWorkerError = (event: MessageEvent) => {
      const error = event.data;
      toast({
        variant: 'destructive',
        title: 'Worker Error',
        description: error.message || 'An unknown error occurred in the worker',
      });
      console.error('Worker error:', error);
    };

    // Handle unhandled promise rejections (where SQL errors seem to surface)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: error.message || 'An unknown database error occurred',
      });
      console.error('Unhandled rejection:', error);
    };

    // Handle regular errors
    const handleError = (event: ErrorEvent) => {
      toast({
        variant: 'destructive',
        title: 'Application Error',
        description: event.message || 'An unknown error occurred',
      });
      console.error('Error:', event.error);
    };

    // Add all listeners
    channel.addEventListener('message', handleWorkerError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      channel.removeEventListener('message', handleWorkerError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      );
      window.removeEventListener('error', handleError);
      channel.close();
    };
  }, []);

  return null;
}
