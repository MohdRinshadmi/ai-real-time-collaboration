const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// This app lives in a pnpm monorepo. Metro must watch the repo root so it can
// resolve workspace packages (@collab/*) and their hoisted dependencies.
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    // pnpm uses symlinks; let Metro follow them.
    unstable_enableSymlinks: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
