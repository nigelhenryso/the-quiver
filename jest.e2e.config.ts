import type { Config } from 'jest'
import nextJest from 'next/jest.js'

// Used only by:  pnpm test:e2e   (Selenium tests in tests/e2e)
const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/e2e/**/*.e2e.test.ts'],
  testTimeout: 90_000, // a browser test is slow: page loads, login, redirects
  maxWorkers: 1, // one browser at a time
  moduleNameMapper: {
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)