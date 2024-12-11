# React Hooks for Browser AI Prompt API
# @miguelspizza/use-prompt-api


A collection of React hooks for interacting with the browser's built-in AI capabilities. This package provides typed interfaces and React hooks for accessing language models, managing AI sessions, and handling AI-powered summarization directly in your React applications.

## Installation

```bash
npm install @miguelspizza/use-prompt-api
```

## Features

- 🧠 Access browser-provided language models
- 💬 Manage stateless and stateful AI chat sessions
- 📝 AI-powered text summarization
- ⚡ Streaming responses support
- 🔄 Progress monitoring and abort controls
- 🎯 Type-safe interfaces
- 🛡️ Built-in error handling

## Hooks Overview

### `useAICapabilities` and `AICapabilitiesProvider`

Hook and provider for checking and managing AI model capabilities in the browser.

```typescript
const {
  available,          // AI availability status: 'readily' | 'after-download' | 'no'
  capabilities,       // Raw capabilities object from the browser
  error,             // Any capability-related errors
  downloadProgress,   // Download progress for models: { loaded: number, total: number }
  isDownloading,     // Whether a model is currently downloading
  supportsLanguage,  // Function to check language support
  defaultTemperature, // Default temperature value for the model
  defaultTopK,       // Default topK value for the model
  maxTopK,          // Maximum allowed topK value
  startDownload,     // Function to trigger model download
  cancelDownload     // Function to cancel ongoing download
} = useAICapabilities();
```

#### Provider Setup

The hook must be used within an `AICapabilitiesProvider`:

```typescript
function App() {
  return (
    <AICapabilitiesProvider>
      <YourComponents />
    </AICapabilitiesProvider>
  );
}
```

#### Error Types

The hook provides typed error handling for capability and download-related issues:

```typescript
type UseAICapabilitiesError =
  | AIDownloadError<'DOWNLOAD_CANCELLED' | 'DOWNLOAD_FAILED'>
  | AICapabilityError<'API_UNAVAILABLE' | 'CAPABILITY_CHECK_FAILED'>;
```

#### Example Usage

```typescript
function AIModelManager() {
  const {
    available,
    isDownloading,
    downloadProgress,
    error,
    startDownload,
    cancelDownload,
    supportsLanguage
  } = useAICapabilities();

  useEffect(() => {
    // Check if model needs downloading
    if (available === 'after-download') {
      const shouldDownload = confirm('Download AI model?');
      if (shouldDownload) {
        startDownload();
      }
    }
  }, [available]);

  // Check language support
  const supportsSpanish = supportsLanguage('es');

  return (
    <div>
      <h2>AI Model Status</h2>

      {/* Availability Status */}
      <div>
        Status: {available === 'readily' ? 'Ready to use' :
                available === 'after-download' ? 'Needs download' :
                'Not available'}
      </div>

      {/* Download Progress */}
      {isDownloading && downloadProgress && (
        <div>
          Downloading: {Math.round((downloadProgress.loaded / downloadProgress.total) * 100)}%
          <button onClick={cancelDownload}>Cancel</button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div>Error: {error.message}</div>
      )}
    </div>
  );
}
```

#### Implementation Notes

- Automatically checks for AI capabilities when mounted
- Manages model download state and progress
- Provides language support checking functionality
- Handles cleanup of downloads when cancelled
- Exposes model configuration defaults and limits
- SSR-safe with window object checks
- Provides context for AI capabilities across your app

#### Availability States

The `available` property can be one of three values:
- `"readily"`: The model is ready to use immediately
- `"after-download"`: The model needs to be downloaded first
- `"no"`: The device or browser doesn't support AI capabilities

#### Language Support

Check if the model supports specific languages using BCP 47 language tags:

```typescript
const { supportsLanguage } = useAICapabilities();

// Check language support
const englishSupport = supportsLanguage('en');
const spanishSupport = supportsLanguage('es');
const chineseSupport = supportsLanguage('zh');
```

#### Download Management

The hook provides complete control over model downloads:

```typescript
const { startDownload, cancelDownload, isDownloading, downloadProgress } = useAICapabilities();

// Start download with progress monitoring
async function handleDownload() {
  try {
    await startDownload();
    console.log('Download completed successfully');
  } catch (err) {
    console.error('Download failed:', err);
  }
}

// Cancel ongoing download
function handleCancel() {
  cancelDownload();
}
```

### `useStatelessPromptAPI`

Hook for managing stateless AI chat sessions with browser-provided language models.

```typescript
const {
  loading,        // Loading state for session operations
  error,          // Any prompt-related errors
  sendPrompt,     // Function to send prompts
  abort,          // Abort ongoing operations
  session,        // Current AI session
  isResponding,   // Whether the model is currently responding
  isThinking      // Whether the model is processing but hasn't started responding
} = useStatelessPromptAPI(sessionId, options);
```

#### Options

```typescript
interface AILanguageModelCreateOptionsWithSystemPrompt {
  initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant', content: string }>;
  monitor?: (monitor: AICreateMonitor) => void;
  signal?: AbortSignal;
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
}
```

- `sessionId` (string | number | Symbol): Unique identifier for the session
- `initialPrompts`: Array of initial prompts to establish context
- `monitor`: Callback for monitoring model download progress
- `signal`: AbortSignal for canceling operations
- `systemPrompt`: System-level instructions for the model
- `temperature`: Controls randomness in responses (0-1)
- `topK`: Controls diversity of token selection

#### Error Handling

The hook provides typed error handling for common scenarios:

```typescript
type UseStatelessPromptAPIError = {
  code: 'SESSION_UNAVAILABLE' | 'SESSION_CREATION_FAILED' | 'PROMPT_FAILED' | 'EMPTY_PROMPT';
  name: string;
  message: string;
}
```

#### Streaming Support

The `sendPrompt` function supports both standard and streaming responses:

```typescript
interface SendPromptOptions {
  streaming?: boolean;
  signal?: AbortSignal;
  onToken?: (response: string) => void | Promise<void>;
}
```

#### Example Usage

```typescript
function ChatComponent() {
  const {
    sendPrompt,
    isResponding,
    isThinking,
    error
  } = useStatelessPromptAPI('chat-session', {
    systemPrompt: 'You are a helpful assistant.',
    temperature: 0.7,
    topK: 40
  });

  const handleSend = async (message: string) => {
    try {
      const response = await sendPrompt(message, {
        streaming: true,
        onToken: (token) => {
          // Handle streaming tokens
          console.log('Received token:', token);
        }
      });
      // Handle complete response
    } catch (err) {
      // Handle error
    }
  };

  return (
    <div>
      {isThinking && <div>Thinking...</div>}
      {isResponding && <div>Responding...</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

#### Implementation Notes

- The hook manages the lifecycle of an AI language model session
- Sessions are automatically cleaned up when the component unmounts
- System prompts are preserved even if the context window overflows
- Supports both streaming and non-streaming responses
- Provides real-time status indicators for model state
- Handles download and initialization of browser-provided models

### `useSummarizer`

Hook for AI-powered text summarization.

```typescript
const {
  streamingResponse,  // Current streaming response
  loading,           // Loading state
  error,             // Any summarization errors
  summarize,         // Function to trigger summarization
  abort              // Abort summarization
} = useSummarizer(options);
```

## TypeScript Support

This package is written in TypeScript and provides full type definitions for all APIs.

## Browser Compatibility

This package requires a browser that implements the Browser AI Prompt API. Check the API's compatibility table for supported browsers.

## Contributing

Contributions are welcome! Please read our contributing guidelines for details.

## License

MIT

---

## Development Status

This package is based on an experimental browser API proposal. The API and this package's interface may change as the specification evolves.

For more information about the underlying Browser AI Prompt API, see the [official explainer](https://github.com/explainers-by-googlers/prompt-api).