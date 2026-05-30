/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals', '../../packages/config/eslint-base.cjs'],
  rules: {
    'react/no-unescaped-entities': 'off',
  },
};
