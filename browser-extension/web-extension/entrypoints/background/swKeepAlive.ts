// 1. Uses the offscreen API (Chrome 109+)
// 2. Falls back to the chrome API bug exploit if offscreen isn't available
// 3. Includes proper cleanup and error handling

export class ServiceWorkerKeepAlive {
  private keepAliveInterval: ReturnType<typeof setInterval> | null;
  private readonly INTERVAL_PERIOD: number;
  private readonly isOffscreenSupported: boolean;

  constructor() {
    this.keepAliveInterval = null;
    this.INTERVAL_PERIOD = 20000; // 20 seconds
    this.isOffscreenSupported = 'offscreen' in chrome;
  }

  async start() {
    if (this.keepAliveInterval) {
      return; // Already running
    }

    if (this.isOffscreenSupported) {
      await this.startOffscreenKeepAlive();
    } else {
      this.startFallbackKeepAlive();
    }
  }

  async stop() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.isOffscreenSupported) {
      try {
        await chrome.offscreen.closeDocument();
      } catch (error) {
        console.log('No offscreen document to close');
      }
    }
  }

  private async startOffscreenKeepAlive() {
    try {
      // Create offscreen document if it doesn't exist
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [chrome.offscreen.Reason.BLOBS],
        justification: 'Keep service worker alive'
      }).catch(() => { });

      // Listen for keep-alive messages from the offscreen document
      self.onmessage = (event: MessageEvent) => {
        if (event.data === 'keepAlive') {
          // Service worker will stay alive due to receiving this message
          console.log('Received keep-alive ping');
        }
      };
    } catch (error) {
      console.error('Failed to start offscreen keep-alive:', error);
      // Fall back to traditional method if offscreen fails
      this.startFallbackKeepAlive();
    }
  }

  private startFallbackKeepAlive() {
    // Use the chrome API bug exploit as fallback
    this.keepAliveInterval = setInterval(() => {
      chrome.runtime.getPlatformInfo(() => {
        // This API call keeps the service worker alive
        console.log('Keep-alive ping via getPlatformInfo');
      });
    }, this.INTERVAL_PERIOD);
  }
}