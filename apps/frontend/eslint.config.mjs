import sharedConfig from '@repo/eslint-config';

export default [
  ...sharedConfig,
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];
