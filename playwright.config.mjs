import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://127.0.0.1:4320" },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 4320",
    url: "http://127.0.0.1:4320",
    reuseExistingServer: false,
  },
});
