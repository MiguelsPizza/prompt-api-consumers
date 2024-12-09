# React Hooks for Browser AI Prompt API
# @miguelspizza/use-prompt-api


A collection of React hooks for interacting with the browser's built-in AI capabilities. This package provides typed interfaces and React hooks for accessing language models, managing AI sessions, and handling AI-powered summarization directly in your React applications.

## Installation

```bash
npm install miguelspizza/prompt-api-hooks
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

### `useAICapabilities`

Hook for checking and managing AI model capabilities in the browser.

```typescript
const {
  available,          // AI availability status
  capabilities,       // Model capabilities
  error,             // Any capability-related errors
  downloadProgress,   // Download progress for models
  isDownloading,     // Download status
  supportsLanguage,  // Language support checker
  startDownload,     // Trigger model download
  cancelDownload     // Cancel ongoing download
} = useAICapabilities();
```

### `useStatelessPromptAPI`

Hook for managing stateless AI chat sessions.

```typescript
const {
  loading,        // Loading state
  error,          // Any prompt-related errors
  sendPrompt,     // Function to send prompts
  abort,          // Abort ongoing operations
  session,        // Current AI session
  isResponding,   // Response status
  isThinking      // Thinking status
} = useStatelessPromptAPI(sessionId, options);
```

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

## Detailed Usage

### AI Capabilities Management

```typescript
import { useAICapabilities, AICapabilitiesProvider } from 'miguelspizza/prompt-api-hooks';

function App() {
  return (
    <AICapabilitiesProvider>
      <YourComponent />
    </AICapabilitiesProvider>
  );
}

function YourComponent() {
  const { available, capabilities, startDownload } = useAICapabilities();

  useEffect(() => {
    if (available === 'after-download') {
      // Prompt user before starting download
      const shouldDownload = confirm('Download AI model?');
      if (shouldDownload) {
        startDownload();
      }
    }
  }, [available]);

  return (
    // Your component JSX
  );
}
```

### Stateless Prompt API

```typescript
import { useStatelessPromptAPI } from 'miguelspizza/prompt-api-hooks';

function ChatComponent() {
  const {
    sendPrompt,
    isResponding,
    isThinking,
    error
  } = useStatelessPromptAPI('unique-session-id', {
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
        }
      });
      // Handle response
    } catch (err) {
      // Handle error
    }
  };

  return (
    // Your component JSX
  );
}
```

### Text Summarization

```typescript
import { useSummarizer } from 'miguelspizza/prompt-api-hooks';

function SummarizerComponent() {
  const {
    summarize,
    streamingResponse,
    loading
  } = useSummarizer({
    type: 'tl;dr',
    format: 'plain-text',
    length: 'medium'
  });

  const handleSummarize = async (text: string) => {
    try {
      const summary = await summarize(text, {
        streaming: true
      });
      // Handle summary
    } catch (err) {
      // Handle error
    }
  };

  return (
    // Your component JSX
  );
}
```

## Error Handling

The package provides typed error classes for different scenarios:

```typescript
// AI Capability Errors
export interface IAICapabilityError {
  code: 'API_UNAVAILABLE' | 'CAPABILITY_CHECK_FAILED';
  name: string;
  message: string;
}

// Prompt API Errors
export interface IPromptAPIError {
  code: 'SESSION_UNAVAILABLE' | 'SESSION_CREATION_FAILED' | 'PROMPT_FAILED' | 'EMPTY_PROMPT';
  name: string;
  message: string;
}

// Summarizer Errors
export interface ISummarizerError {
  code: 'SESSION_UNAVAILABLE' | 'SESSION_CREATION_FAILED' | 'SUMMARIZE_FAILED' | 'EMPTY_INPUT';
  name: string;
  message: string;
}
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