// jest.config.cjs
module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    transform: {
      '^.+\\.ts$': ['ts-jest', { useESM: true }],
    },
    extensionsToTreatAsEsm: ['.ts'],
  };
  