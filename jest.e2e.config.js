/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  preset: "jest-playwright-preset",
  testEnvironment: "./custom-environment.js",
  testEnvironmentOptions: {
    'jest-playwright': {
      launchOptions: {
        headless: true
      },
      debugOptions: {
        launchOptions: {
          headless: false,
          devtools: true
        }
      },
      contextOptions: {
        ignoreHTTPSErrors: true,
        hasTouch: true
      }
    }
  },
  // The root directory that Jest should scan for tests and modules within
  rootDir: "test/end2end",
  setupFilesAfterEnv: ["expect-playwright"]

};
