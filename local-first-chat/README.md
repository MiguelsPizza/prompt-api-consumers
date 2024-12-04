# Local First Chat - A PowerSync + Supabase Demo

## Overview

This app demonstrates using [PowerSync SDK for Web](https://www.npmjs.com/package/@powersync/web) to create a ChatGPT-like chat application with full offline capabilities and cloud sync. Users can use the app without signing in, and their chat history persists locally. Once they register, their data seamlessly syncs to the cloud.

This app was built on top of the [PowerSync + Supabase Web Demo Template](https://github.com/powersync-ja/powersync-js/tree/main/demos/react-supabase-todolist-optional-sync) (MIT Licensed).

The recommended flow through this app is:

1. Use the app in local-only mode and chat with the AI. Your chat history persists even when offline.
2. Register/sign in when you want to sync your data to the cloud.
3. Your previous chat history will seamlessly sync to Supabase.

# Run the app in local-only mode

In the repo directory, use [pnpm](https://pnpm.io/installation) to install dependencies:
