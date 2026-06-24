module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
        },
      },
    ],
    // react-native-reanimated/plugin MUST be listed last.
    'react-native-reanimated/plugin',
  ],
};
