import type { Config } from 'jest'

const config: Config = {
    preset: 'ts-jest/presets/default-esm',
    setupFilesAfterEnv: ['@dotenvx/dotenvx/config'],
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.api.test.ts', '**/__tests__/**/*.db.test.ts'],
    moduleNameMapper: {
        '^@/lib/(.*)$': '<rootDir>/app/lib/$1',
        '^@/app/(.*)$': '<rootDir>/app/$1',
    },
    testPathIgnorePatterns: ['<rootDir>/node_modules/'],
    collectCoverage: false,
    coverageDirectory: 'coverage',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
    }
}

export default config;