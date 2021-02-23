module.exports = {
  // preset: 'ts-jest',
  // testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: false,
  reporters: ['default', 'jest-html-reporters'],
  setupFilesAfterEnv: ['./setup-jest.js'],
};
