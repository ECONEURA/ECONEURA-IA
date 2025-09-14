// Jest config for Next.js App Router project
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jsdom',
  // Ignore Playwright UI tests, Next.js build output and node_modules
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/tests/ui/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Default patterns cover *.test.ts(x) and *.spec.ts(x)
};

module.exports = createJestConfig(customJestConfig);
