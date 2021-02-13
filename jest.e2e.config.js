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
      contextOptions: {
        ignoreHTTPSErrors: true,
        hasTouch: true,
        storageState: {
          cookies: [
            {
              sameSite: 'None',
              name: 'm_user',
              value: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiI0OTM2MGYxZi02YThlLTRjMTEtODMxMC1jYzkwODY5YWYxNWYiLCJpcCI6IjE5Mi4xNjguMC4xMiJ9.3jUXwcU1zLcOGWlNoFrLsYUw5y-pR7707jNOK-EImxg',
              domain: 'mondev.chandlerfamily.org.uk',
              path: '/',
              expires: -1,
              httpOnly: false,
              secure: false
            }
          ]
        }
      }
    }
  },
  // The root directory that Jest should scan for tests and modules within
  rootDir: "test/end2end",
  setupFilesAfterEnv: ["expect-playwright"]

};
