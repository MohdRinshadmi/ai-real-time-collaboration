# assets

Static assets bundled with the app — images, fonts, Lottie files, etc.

Reference them from code with `require('@/assets/<file>')`, e.g.:

```ts
const logo = require('@/assets/images/logo.png');
```

Add a `react-native.config.js` `assets` entry (or `npx react-native-asset`) to
link custom fonts into the native projects.
