// Script to inject and register the DownloadTracker custom element
import { windowLink } from '@/chromeTrpcAdditions/trpc-browser/link';
import { createTRPCProxyClient } from '@trpc/client';
import { Unsubscribable } from '@trpc/server/observable';
import type { AppRouter } from './background/routers';

// Define the properties of our custom element
export interface SidePanelControlsElement extends HTMLElement {
  isOpen: boolean;
  trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null;
  subscription: Unsubscribable | null;
}

// Define the properties of our custom element
export interface DownloadTrackerElement extends HTMLElement {
  downloadProgress: number;
  downloadStatusText: string;
  timeElapsed: number;
  isCompleted: boolean;
  trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null; // The TRPC client for subscribing to events
  subscription: Unsubscribable | null; // Reference to the subscription
  // Methods
  reset(): void;
  setTheme(theme: 'light' | 'dark' | 'colorful'): void;
}
export default defineUnlistedScript(() => {

  function getStatusText(text: string): string {
    if (!text) return '';

    // 1. Model Loading and Completion Messages
    if (text.includes('Finish loading on')) {
      return 'Loading complete';
    }

    // 2. Fetching Parameter Cache
    if (text.includes('Fetching param cache')) {
      const mbMatch = text.match(/(\d+)MB fetched/);
      const stepMatch = text.match(/cache\[(\d+)\/(\d+)\]/);
      const percentMatch = text.match(/(\d+)% complete/);
      return [
        `Fetching model parameters (${stepMatch ? stepMatch[1] : '?'}/${stepMatch ? stepMatch[2] : '?'})`,
        mbMatch ? `${mbMatch[1]}MB downloaded` : '',
        percentMatch ? `${percentMatch[1]}% complete` : ''
      ]
        .filter(Boolean)
        .join(' • ');
    }

    // 3. Loading from Cache
    if (text.includes('Loading model from cache') || text.includes('Load ndarray cache')) {
      const stepMatch = text.match(/cache\[(\d+)\/(\d+)\]/);
      const mbMatch = text.match(/(\d+)MB loaded/);
      return [
        `Loading from cache (${stepMatch ? stepMatch[1] : '?'}/${stepMatch ? stepMatch[2] : '?'})`,
        mbMatch ? `${mbMatch[1]}MB loaded` : ''
      ]
        .filter(Boolean)
        .join(' • ');
    }

    // 4. Loading Component
    if (text.match(/Load [a-zA-Z0-9_.-]+/)) {
      const componentMatch = text.match(/Load ([a-zA-Z0-9_.-]+)/);
      const percentMatch = text.match(/(\d+)%/);
      return `Loading ${componentMatch ? componentMatch[1] : 'component'}${percentMatch ? ` (${percentMatch[1]}%)` : ''}`;
    }

    // 5. GPU Shader Loading
    if (text.includes('Loading shaders') || text.includes('Loading GPU shader')) {
      const moduleMatch = text.match(/\[(\d+)\/(\d+)\]/);
      return `Loading GPU shaders (${moduleMatch ? moduleMatch[1] : '?'}/${moduleMatch ? moduleMatch[2] : '?'})`;
    }

    // 6. WebGPU Pipeline Initialization
    if (text.includes('Initialize WebGPU pipeline')) {
      return 'Initializing WebGPU pipeline';
    }

    // 7. Tokenizer and Config Loading
    if (text.includes('Load tokenizer')) {
      return 'Loading tokenizer';
    }

    if (text.includes('Load config')) {
      return 'Loading configuration';
    }

    // Default case: return the original text
    return text;
  }

  class DownloadTracker extends HTMLElement implements DownloadTrackerElement {
    // Define shadow DOM template
    static get template() {
      const template = document.createElement('template');
      template.innerHTML = `
      <style>
        :host {
          display: none; /* Hide by default */
          font-family: var(--dt-font-family, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif);
          margin: var(--dt-margin, 10px 0);

          /* Define all customizable properties with defaults */
          --dt-border-color: #e0e0e0;
          --dt-background-color: #f9f9f9;
          --dt-box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          --dt-border-radius: 8px;
          --dt-padding: 12px;

          --dt-progress-height: 8px;
          --dt-progress-background: #eaeaea;
          --dt-progress-border-radius: 4px;
          --dt-progress-margin: 8px 0;

          --dt-progress-fill-color: #4a6cf7;
          --dt-progress-completed-color: #10b981;
          --dt-progress-transition: width 0.3s ease;

          --dt-text-color: #333;
          --dt-subtext-color: #666;
          --dt-text-size: 14px;
          --dt-subtext-size: 12px;
          --dt-subtext-margin-top: 4px;
        }

        :host(.active) {
          display: block; /* Show when active */
        }

        .download-tracker {
          border: 1px solid var(--dt-border-color);
          border-radius: var(--dt-border-radius);
          padding: var(--dt-padding);
          background-color: var(--dt-background-color);
          box-shadow: var(--dt-box-shadow);
        }

        .progress-bar {
          height: var(--dt-progress-height);
          background-color: var(--dt-progress-background);
          border-radius: var(--dt-progress-border-radius);
          overflow: hidden;
          margin: var(--dt-progress-margin);
        }

        .progress-bar-inner {
          height: 100%;
          background-color: var(--dt-progress-fill-color);
          width: 0%;
          transition: var(--dt-progress-transition);
        }

        .status-text {
          font-size: var(--dt-text-size);
          color: var(--dt-text-color);
        }

        .time-elapsed {
          font-size: var(--dt-subtext-size);
          color: var(--dt-subtext-color);
          margin-top: var(--dt-subtext-margin-top);
        }

        .completed .progress-bar-inner {
          background-color: var(--dt-progress-completed-color);
        }
      </style>

      <div class="download-tracker" part="container">
        <div class="progress-bar" part="progress-container">
          <div class="progress-bar-inner" part="progress-bar"></div>
        </div>
        <div class="status-text" part="status-text"></div>
        <div class="time-elapsed" part="time-elapsed"></div>
      </div>
    `;
      return template;
    }

    // Properties of the element
    downloadProgress: number = 0;
    downloadStatusText: string = '';
    timeElapsed: number = 0;
    isCompleted: boolean = false;
    trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null = null;
    subscription: Unsubscribable | null = null;

    // DOM elements
    private progressBarInner: HTMLElement | null = null;
    private statusTextElement: HTMLElement | null = null;
    private timeElapsedElement: HTMLElement | null = null;
    private containerElement: HTMLElement | null = null;

    // Auto removal timeout
    private removalTimeout: number | null = null;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      if (this.shadowRoot) {
        this.shadowRoot.appendChild(DownloadTracker.template.content.cloneNode(true));

        // Store references to elements
        this.progressBarInner = this.shadowRoot.querySelector('.progress-bar-inner');
        this.statusTextElement = this.shadowRoot.querySelector('.status-text');
        this.timeElapsedElement = this.shadowRoot.querySelector('.time-elapsed');
        this.containerElement = this.shadowRoot.querySelector('.download-tracker');
      }

      // Initialize the TRPC client
      this.initClient();
      this.startListening();
    }

    connectedCallback() {
      // Set accessibility attributes
      if (this.containerElement) {
        this.containerElement.setAttribute('role', 'progressbar');
        this.containerElement.setAttribute('aria-live', 'polite');
        this.containerElement.setAttribute('aria-label', 'Download progress');
        this.progressBarInner?.setAttribute('aria-valuenow', '0');
        this.progressBarInner?.setAttribute('aria-valuemin', '0');
        this.progressBarInner?.setAttribute('aria-valuemax', '100');
      }

      // Start listening for download events
      this.startListening();

    }

    disconnectedCallback() {
      // Clean up the subscription when element is removed
      this.stopListening();

      // Clear any pending removal timeout
      if (this.removalTimeout !== null) {
        window.clearTimeout(this.removalTimeout);
        this.removalTimeout = null;
      }
    }

    // Initialize the TRPC client
    private initClient() {
      try {
        this.trpcClient = createTRPCProxyClient<AppRouter>({
          links: [windowLink({ window })],
        });
      } catch (error) {
        console.error('[DownloadTracker] Failed to initialize TRPC client:', error);
      }
    }

    // Start listening for download events
    private startListening() {
      if (!this.trpcClient) {
        console.error('[DownloadTracker] Cannot start listening: TRPC client not initialized');
        return;
      }

      try {
        this.subscription = this.trpcClient.languageModel.downloadProgress.subscribe(undefined, {
          onData: (data) => {
            console.log({ data });
            this.updateProgress(data);
          },
          onError: (error) => {
            console.error('[DownloadTracker] Subscription error:', error);
            this.statusTextElement!.textContent = 'Error tracking download';
            this.scheduleRemoval();
          }
        });
      } catch (error) {
        console.error('[DownloadTracker] Failed to subscribe to download progress:', error);
      }
    }

    // Stop listening for download events
    private stopListening() {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
    }

    // Schedule removal of the element
    private scheduleRemoval(delay = 100) {
      // Clear any existing timeout
      if (this.removalTimeout !== null) {
        window.clearTimeout(this.removalTimeout);
      }

      // Set new timeout to remove the element
      this.removalTimeout = window.setTimeout(() => {
        this.remove();
      }, delay);
    }

    // Update the progress UI
    private updateProgress(data: {
      progress: number,
      timeElapsed: number,
      text: string
    }) {
      if (!this.progressBarInner || !this.statusTextElement || !this.timeElapsedElement || !this.containerElement) {
        return;
      }

      // Make element visible when tracking begins
      if (!this.classList.contains('active')) {
        this.classList.add('active');
      }

      // Update properties
      this.downloadProgress = data.progress;
      this.downloadStatusText = data.text;
      this.timeElapsed = data.timeElapsed;

      // Calculate percentage (0-100)
      const progressPercentage = Math.min(Math.max(this.downloadProgress * 100, 0), 100);

      // Update the UI - ensure the progress bar is always updated
      this.progressBarInner.style.width = `${progressPercentage}%`;

      // Update accessibility attributes
      this.progressBarInner.setAttribute('aria-valuenow', progressPercentage.toString());

      // Parse and format the status text
      const statusText = getStatusText(this.downloadStatusText);

      // Always show both the status text and percentage
      this.statusTextElement.textContent = `${statusText} ${progressPercentage.toFixed(0)}%`;

      // Update time elapsed
      if (this.timeElapsed > 0) {
        this.timeElapsedElement.textContent = `Time elapsed: ${this.timeElapsed.toFixed(1)}s`;
      }

      // Check if download is complete
      if (progressPercentage >= 100 || this.downloadStatusText.includes('Finish loading')) {
        this.isCompleted = true;
        this.containerElement.classList.add('completed');
        this.statusTextElement.textContent = 'Download complete';

        // Update accessibility for completed state
        this.containerElement.setAttribute('aria-label', 'Download completed');

        // Dispatch a custom event when download is complete
        this.dispatchEvent(new CustomEvent('downloadcomplete', {
          bubbles: true,
          composed: true,
          detail: { timeElapsed: this.timeElapsed }
        }));

        // Schedule the element to be removed after completion
        this.scheduleRemoval(0);
      }
    }

    // Public API to reset the tracker
    public reset() {
      if (!this.progressBarInner || !this.statusTextElement || !this.timeElapsedElement || !this.containerElement) {
        return;
      }

      this.downloadProgress = 0;
      this.downloadStatusText = '';
      this.timeElapsed = 0;
      this.isCompleted = false;

      this.progressBarInner.style.width = '0%';
      this.statusTextElement.textContent = '';
      this.timeElapsedElement.textContent = '';
      this.containerElement.classList.remove('completed');
      this.classList.remove('active'); // Hide the element

      // Clear any pending removal timeout
      if (this.removalTimeout !== null) {
        window.clearTimeout(this.removalTimeout);
        this.removalTimeout = null;
      }
    }

    // Public method to set a theme preset
    public setTheme(theme: 'light' | 'dark' | 'colorful' = 'light') {
      switch (theme) {
        case 'dark':
          this.style.setProperty('--dt-background-color', '#222');
          this.style.setProperty('--dt-border-color', '#444');
          this.style.setProperty('--dt-text-color', '#eee');
          this.style.setProperty('--dt-subtext-color', '#bbb');
          this.style.setProperty('--dt-progress-background', '#333');
          this.style.setProperty('--dt-progress-fill-color', '#6c8dff');
          this.style.setProperty('--dt-progress-completed-color', '#2dd4a5');
          break;
        case 'colorful':
          this.style.setProperty('--dt-background-color', '#f5f0ff');
          this.style.setProperty('--dt-border-color', '#d0c5f0');
          this.style.setProperty('--dt-progress-fill-color', '#8a4fff');
          this.style.setProperty('--dt-progress-completed-color', '#00c68a');
          break;
        default: // light theme
          // Reset to default theme (remove inline styles)
          this.style.cssText = '';
          break;
      }
    }
  }

  // Create a singleton TRPC client for monitoring downloads
  let globalTrpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null = null;
  let globalSubscription: Unsubscribable | null = null;

  // Function to create and initialize the global TRPC client
  function initGlobalClient() {
    if (globalTrpcClient) return;

    try {
      globalTrpcClient = createTRPCProxyClient<AppRouter>({
        links: [windowLink({ window })],
      });
    } catch (error) {
      console.error('[DownloadTrackerInjector] Failed to initialize global TRPC client:', error);
    }
  }

  try {
    console.log('[DownloadTrackerInjector] Registering custom element...');

    if (!customElements.get('download-tracker')) {
      customElements.define('download-tracker', DownloadTracker);
      console.log('[DownloadTracker] Custom element registered');

      // Initialize the global client and start listening for downloads
      initGlobalClient();
      // startListeningForDownloads();
    }

  } catch (error) {
    console.error('[DownloadTrackerInjector] Failed to register custom element:', error);
  }


  class SidePanelControls extends HTMLElement implements SidePanelControlsElement {
    static get template() {
      const template = document.createElement('template');
      template.innerHTML = `
        <style>
          :host {
            position: fixed;
            right: 20px;
            top: 20px;
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
          }

          .controls-container {
            background: var(--sp-background, #ffffff);
            border: 1px solid var(--sp-border-color, #e0e0e0);
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .button {
            all: unset;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 6px;
            background: var(--sp-button-bg, #f5f5f5);
            color: var(--sp-text-color, #333);
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.2s;
          }

          .button:hover {
            background: var(--sp-button-hover-bg, #e5e5e5);
          }

          .button.active {
            background: var(--sp-button-active-bg, #4a6cf7);
            color: white;
          }

          .status-text {
            font-size: 12px;
            color: var(--sp-status-color, #666);
            text-align: center;
          }
        </style>

        <div class="controls-container" part="container">
          <button class="button toggle-panel" part="toggle-button">
            <span class="button-text">Toggle Side Panel</span>
          </button>
          <div class="status-text" part="status"></div>
        </div>
      `;
      return template;
    }

    isOpen: boolean = false;
    trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null = null;
    subscription: Unsubscribable | null = null;

    private toggleButton: HTMLButtonElement | null = null;
    private statusText: HTMLElement | null = null;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      if (this.shadowRoot) {
        this.shadowRoot.appendChild(SidePanelControls.template.content.cloneNode(true));

        this.toggleButton = this.shadowRoot.querySelector('.toggle-panel');
        this.statusText = this.shadowRoot.querySelector('.status-text');
      }

      this.initClient();
    }

    connectedCallback() {
      this.setupEventListeners();
      this.updateInitialState();
    }

    disconnectedCallback() {
      this.stopListening();
    }

    private initClient() {
      try {
        this.trpcClient = createTRPCProxyClient<AppRouter>({
          links: [windowLink({ window })],
        });
      } catch (error) {
        console.error('[SidePanelControls] Failed to initialize TRPC client:', error);
      }
    }

    private async updateInitialState() {
      if (!this.trpcClient) return;

      try {
        const config = await this.trpcClient.extension.getSidePanelConfig.query();
        this.updateState(config.isEnabled, config.currentPath);
      } catch (error) {
        console.error('[SidePanelControls] Failed to get initial state:', error);
      }
    }

    private setupEventListeners() {
      this.toggleButton?.addEventListener('click', async () => {
        if (!this.trpcClient) return;

        try {
          if (this.isOpen) {
            await this.trpcClient.extension.toggleSidePanel.mutate({ open: false });
          } else {
            await this.trpcClient.extension.toggleSidePanel.mutate({ open: true });
          }
        } catch (error) {
          console.error('[SidePanelControls] Failed to toggle panel:', error);
        }
      });
    }

    private stopListening() {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
    }

    private updateState(isOpen: boolean, currentPath: string | null) {
      this.isOpen = isOpen;

      if (this.toggleButton) {
        this.toggleButton.classList.toggle('active', this.isOpen);
        this.toggleButton.querySelector('.button-text')!.textContent = 
          this.isOpen ? 'Close Side Panel' : 'Open Side Panel';
      }

    }

    // Public method to set a theme
    public setTheme(theme: 'light' | 'dark' | 'colorful' = 'light') {
      switch (theme) {
        case 'dark':
          this.style.setProperty('--sp-background', '#222');
          this.style.setProperty('--sp-border-color', '#444');
          this.style.setProperty('--sp-text-color', '#eee');
          this.style.setProperty('--sp-status-color', '#bbb');
          this.style.setProperty('--sp-button-bg', '#333');
          this.style.setProperty('--sp-button-hover-bg', '#444');
          this.style.setProperty('--sp-button-active-bg', '#6c8dff');
          break;
        case 'colorful':
          this.style.setProperty('--sp-background', '#f5f0ff');
          this.style.setProperty('--sp-border-color', '#d0c5f0');
          this.style.setProperty('--sp-button-bg', '#e5e0ff');
          this.style.setProperty('--sp-button-hover-bg', '#d5d0ff');
          this.style.setProperty('--sp-button-active-bg', '#8a4fff');
          break;
        default: // light theme
          this.style.cssText = '';
          break;
      }
    }
  }

  try {
    console.log('[SidePanelControlsInjector] Registering custom element...');

    if (!customElements.get('side-panel-controls')) {
      customElements.define('side-panel-controls', SidePanelControls);
      console.log('[SidePanelControls] Custom element registered');
    }
  } catch (error) {
    console.error('[SidePanelControlsInjector] Failed to register custom element:', error);
  }
})