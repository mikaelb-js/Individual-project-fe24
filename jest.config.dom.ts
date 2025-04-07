import type { Config } from 'jest'

const config: Config = {
    preset: 'ts-jest',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '@dotenvx/dotenvx/config'],
    testEnvironment: 'jest-environment-jsdom',
    testMatch: ['**/__tests__/**/*.ui.test.ts'],
    moduleNameMapper: {
        '^@/components/(.*)$': '<rootDir>/app/Components/$1',
        '^@/app/(.*)$': '<rootDir>/app/$1',
    },
    testPathIgnorePatterns: ['<rootDir>/node_modules/'],
    collectCoverage: false,
    coverageDirectory: 'coverage',
}

export default config;