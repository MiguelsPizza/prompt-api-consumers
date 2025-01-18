// import "./PWABadge.css";

import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useEffect } from 'react';

function PWABadge() {
  const period = 60 * 60;
  const { toast } = useToast();

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl: string, r) {
      if (period <= 0) return;
      if (r?.active?.state === 'activated') {
        registerPeriodicSync(period, swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener('statechange', (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === 'activated') {
            registerPeriodicSync(period, swUrl, r);
          }
        });
      }
    },
  });

  function close() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  // Show toast when status changes
  useEffect(() => {
    if (offlineReady || needRefresh) {
      toast({
        title: needRefresh ? 'Update Available' : 'Offline Ready',
        description: needRefresh
          ? 'A new version is available. Click to update.'
          : 'App is ready to work offline',
        duration: 5000,
        action: needRefresh ? (
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => updateServiceWorker(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <ReloadIcon className="mr-2 h-4 w-4" />
              Update
            </Button>
            <Button variant="secondary" size="sm" onClick={close}>
              Later
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={close}>
            Dismiss
          </Button>
        ),
      });
    }
  }, [offlineReady, needRefresh]);

  // Component no longer needs to render anything visible
  return null;
}

export default PWABadge;

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration,
) {
  if (period <= 0) return;

  setInterval(async () => {
    if ('onLine' in navigator && !navigator.onLine) {
      return;
    }

    const resp = await fetch(swUrl, {
      cache: 'no-store',
      headers: {
        cache: 'no-store',
        'cache-control': 'no-cache',
      },
    });

    if (resp.status === 200) {
      await r.update();
    }
  }, period);
}
