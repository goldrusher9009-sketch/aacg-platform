export default {
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    testTimeout: 60000,
  },
};
