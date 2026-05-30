# @collab/mobile

React Native **0.84** mobile client for the AI-powered real-time collaboration
platform. It mirrors the web app (`apps/web`) feature-for-feature on iOS and
Android, reusing the shared `@collab/api-contracts` zod schemas so the client
and server stay in lockstep.

## Features

| Feature | Web counterpart | Mobile screen |
| --- | --- | --- |
| Email/password auth | `features/auth/LoginForm` | `screens/LoginScreen` |
| Workspace home + presence | `[workspaceSlug]/page` + `PresenceBar` | `screens/WorkspaceHomeScreen` |
| Realtime channel chat | `features/chat/ChatRoom` | `screens/ChannelListScreen` → `ChatRoomScreen` |
| Documents (read + AI summary) | `features/editor` | `screens/DocumentListScreen` → `DocumentScreen` |
| Streaming AI assistant (RAG) | `features/ai-assistant/AIChatPanel` | `screens/AIAssistantScreen` |

## Project structure

A conventional layered React Native layout under `src/` (import alias `@/*`):

```
api/         HTTP transport (http.ts), socket.ts, sse.ts + domain modules
             (auth.ts, channels.ts, documents.ts)
assets/      images, fonts, static files
components/  reusable UI (Button, Input, Avatar, PresenceBar)
config/      env resolution (per-platform API/WS/AI hosts)
currency/    price/currency formatting for SaaS billing surfaces
global/      design tokens (theme) + app-wide types
hooks/       data hooks (useChannelMessages, useStreamChat, usePresence) +
             re-exported context hooks (useAuth, useSocket, useWorkspace)
layout/      Screen chrome (safe-area + keyboard avoidance)
routes/      React Navigation stacks/tabs + param types
screens/     one component per screen
services/    device services — keychain tokenStore, query client factory
store/       React context providers (Auth, Socket, Workspace, AppProviders)
utils/       pure helpers (id, text/ProseMirror flattening)
```

### How it maps to the web architecture

- **HTTP transport** (`src/api/http.ts`) — same refresh-on-401 + request-id
  flow as web, but uses `Authorization: Bearer` headers + a refresh token
  instead of httpOnly cookies (mobile has no cookie jar). Tokens live in the OS
  keychain/keystore via `react-native-keychain` (`src/services/tokenStore.ts`).
- **WebSocket** (`src/api/socket.ts`) — a direct port of the web `SocketClient`
  (room join/leave, replay on reconnect), plus `AppState`-driven
  connect/disconnect (`src/store/SocketProvider.tsx`) so we don't hold a socket
  open in the background.
- **AI streaming** (`src/api/sse.ts`) — RN's `fetch` can't stream a response
  body, so SSE frames are parsed out of an `XMLHttpRequest`'s growing
  `responseText`. Same frame shapes as `useStreamChat` on web.
- **State** — TanStack Query with the same defaults as web
  (`src/services/queryClient.ts`); optimistic chat sends reconciled against live
  socket events.

## Stack

React 19.2 · React Native 0.84 (New Architecture / Hermes) · React Navigation 7
· TanStack Query 5 · socket.io-client · react-hook-form + zod · react-native-keychain

## Develop

```bash
# from the monorepo root
pnpm install

# bootstrap native projects once (see below), then:
pnpm --filter @collab/mobile start          # Metro bundler
pnpm --filter @collab/mobile ios             # build + run iOS simulator
pnpm --filter @collab/mobile android         # build + run Android emulator
pnpm --filter @collab/mobile typecheck
pnpm --filter @collab/mobile test
```

Point the app at your local backend by copying `.env.example` to `.env`, or just
edit the defaults in `src/config/env.ts`. The defaults already use `10.0.2.2`
for Android emulators and `localhost` for iOS simulators.

The same backend services power this app:

- api → `:4000` · realtime (Socket.IO) → `:4001` · ai-gateway (SSE) → `:4002`

## Bootstrapping native projects

This repo tracks only the cross-platform JS/TS source. Generate the `android/`
and `ios/` folders from the matching template version on first checkout:

```bash
cd apps/mobile
npx @react-native-community/cli@latest init CollabMobile \
  --version 0.84.0 --directory . --skip-install --title Collab
cd ios && pod install            # iOS only, requires CocoaPods + Xcode
```

Then add the keychain pod/Gradle linkage (autolinking handles this on
`pod install` / Gradle sync). The generated `App.tsx`/`index.js` can be
discarded — this package already provides `index.js` and `src/App.tsx`.
