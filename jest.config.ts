import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
    return {
        verbose: true,
        modulePathIgnorePatterns: ['<rootDir>/dist/'],
        preset: 'ts-jest',
        testEnvironment: 'node',
        transform: {
            '^.+\\.tsx?$': ['ts-jest', {
                isolatedModules: true,
                tsconfig: 'tsconfig.spec.json'
            }]
        },
        coverageReporters: ['json-summary', 'lcov', 'text', 'text-summary']
    };
};
