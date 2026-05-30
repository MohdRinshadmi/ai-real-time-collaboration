import {Platform} from 'react-native';

// On a real device/emulator `localhost` does not point at your dev machine.
// - Android emulator reaches the host via 10.0.2.2
// - iOS simulator shares the host network, so localhost works
// Override any of these via the EXPO-style env injected at build time, or just
// edit the defaults below for your environment.
const host = Platform.select({android: '10.0.2.2', default: 'localhost'});

type Env = {
  APP_URL: string;
  API_URL: string;
  WS_URL: string;
  AI_URL: string;
};

// Mirrors the web app's NEXT_PUBLIC_* env (see apps/web/src/lib/env.ts).
export const env: Env = {
  APP_URL: process.env.APP_URL ?? `http://${host}:3000`,
  API_URL: process.env.API_URL ?? `http://${host}:4000`,
  WS_URL: process.env.WS_URL ?? `ws://${host}:4001`,
  AI_URL: process.env.AI_URL ?? `http://${host}:4002`,
};
