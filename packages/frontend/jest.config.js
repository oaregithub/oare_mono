module.exports = {
  verbose: true,

  moduleFileExtensions: ["js", "json", "vue", "ts"],

  transform: {
    ".*\\.(vue)$": "vue-jest",
    "^.+\\.js$": "<rootDir>/node_modules/babel-jest",
  },

  collectCoverage: false,

  collectCoverageFrom: ["src/components/*.{js,vue}", "!**/node_modules/**"],

  coverageReporters: ["html", "text-summary"],

  preset: "@vue/cli-plugin-unit-jest/presets/typescript-and-babel",

  setupFiles: ["./setup-jest.js"],

  testMatch: [
    "**/__tests__/**/*.(t|j)s?(x)",
    // "**/?(*.)+(spec|test).(t|j)s?(x)",
  ],
};
