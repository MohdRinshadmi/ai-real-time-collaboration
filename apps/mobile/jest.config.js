module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  // pnpm stores real package files under node_modules/.pnpm/<pkg>@<ver>/..., so
  // the usual `node_modules/(?!react-native|...)` pattern never matches and RN's
  // ESM ships untransformed. Descend into .pnpm and allow-list the packages that
  // publish untranspiled ES modules.
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!(react-native|@react-native|@react-navigation|react-native-.*|socket\\.io-client|engine\\.io-client))',
  ],
};
