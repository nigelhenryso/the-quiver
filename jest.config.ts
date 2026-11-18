import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Path to your Next.js app, used to load next.config.js and .env files
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // The source code imports files like '@/src/lib/...' (see "paths" in tsconfig.json),
    // so '@/src/...' must point to the real src folder. This line must stay FIRST.
    '^@/src/(.*)$': '<rootDir>/src/$1',
    // Keeps the shorter form '@/services/...' working too (used by tests/unit/Signup.test.tsx).
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)