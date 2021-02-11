/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  preset: "jest-playwright-preset",
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
              value: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiJiYmUxODRmYi1hMzRmLTRlMDQtOTZlOS1lZmI4MzU2MjY4ZWUiLCJpcCI6IjE5Mi4xNjguMC4xMiJ9.d9IRI0HQj5jTByKMw8gd7TlB8dbervaBQRUOAbzVaAo',
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
