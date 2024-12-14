# Local First Chat Monorepo

This is a monorepo containing the [Local First Chat](https://localfirstchat.com) website and [@miguelspizza/use-prompt-api](https://www.npmjs.com/package/@miguelspizza/use-prompt-api) hooks.

## Quick Start

```bash
pnpm dev # Builds and watches hooks, starts web app
pnpm deploy:local # a functional self host of the app to a local port

```

## Project Structure

- `local-first-chat/` - Web application
- `use-prompt-api/` - NPM package for AI API hooks

## Scripts

- `pnpm dev` - Development mode
- `pnpm deploy:local` - Build and test offline mode locally
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

## Requirements

- Node.js >= 18.16.1
- PNPM package manager

## Roadmap

- [ ] Self-hosting support for sync service
- [ ] Migration to PGlite and RAG support
  - Currently uses WASM SQLite for client-side DB
  - PGlite will enable Postgres vector store capabilities
- [ ] ElectricSQL with Cloudflare Durable Objects for sync
  - Replacing PowerSync due to PGlite compatibility
- [ ] Chrome Extension Polyfill
  - Enables bringing custom models while maintaining offline chat storage

## Contributing

Contributions are welcome, especially for additional AI API hooks!

## License

- local-first-chat: AGPL

- hooks: MIT
