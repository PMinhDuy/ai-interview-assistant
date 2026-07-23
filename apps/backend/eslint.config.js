const baseConfig = require('@repo/eslint-config');

module.exports = [
  ...baseConfig,
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'prisma/**', '**/spec.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  }
];
