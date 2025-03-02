
## Basic Usage

1. In your app or extension, import the polyfill pieces:
   ```typescript
   import { createWebAIPolyfill } from "web-ai-polyfill";
   import { attachAIObjectToWindow } from "web-ai-polyfill/attachAi";
   ```

2. Define your provider’s info and lifecycle callbacks:
   ```typescript
   const info = {
     uuid: "abcd1234-abcd-1234-efgh-567890abcdef",
     name: "MyAI",
     icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDov...base64...",
     description: "A custom AI provider for generating text",
   };

   const options = {
     onProviderSelect: () => {
       console.log("MyAI provider selected!");
       // Setup backend, model APIs, etc.
     },
     onProviderDeselect: () => {
       console.log("MyAI provider deselected!");
       // Cleanup, close connections, etc.
     },
   };
   ```

3. (Optionally) Implement or override features:
   ```typescript
   const mySummarizer: AISummarizerFactory = {
     create: async () => {
       // Return a custom summarizer instance
       return {
         summarize: async (input) => {
           return "My summarized text";
         },
         summarizeStreaming: () => {
           // Return a ReadableStream
           throw new Error("Not implemented");
         },
         // ...plus other required fields
       };
     },
     capabilities: async () => ({
       available: "readily",
       supportsType: () => "readily",
       supportsFormat: () => "readily",
       supportsLength: () => "readily",
       languageAvailable: () => "readily",
     }),
   };

   const partialPolyfill = {
     summarizer: mySummarizer,
     // Provide your own or rely on mocks for the others
   };
   ```

4. Create and attach the polyfill:
   ```typescript
   const aiObject = createWebAIPolyfill(info, options, partialPolyfill);
   attachAIObjectToWindow(aiObject);
   ```

5. Now, any script on the page can call:
   ```typescript
   window.ai.summarizer
     .create()
     .then((summarizer) => summarizer.summarize("Hello World"))
     .then(console.log);
   ```

## Extensibility

- You can override any subset of AI features: `languageModel`, `summarizer`, `writer`, `rewriter`, `translator`, `languageDetector`.
- If you do not provide an implementation, the library provides a mock object that throws on usage but satisfies the shape of the API.
- This ensures that your `window.ai` is always a complete, spec-like object.

## Future Work

- Provider conflict resolution if multiple providers attempt `window.ai` injection.
- Improved versioning or prioritization for providers.
- Enhanced documentation and type definitions as the APIs evolve.

---

## Contributing

- Open a pull request if you see any issues or have suggestions on how to improve the package.
- Follow the standard GitHub Flow for contributions.

## License

MIT License © 2023