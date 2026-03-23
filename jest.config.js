module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@expo/.*|expo-router|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|drizzle-orm))',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
