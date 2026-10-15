import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// Tests talk to the same Neon/Blob as the app (for cleanup).
if (!process.env.DATABASE_URL && existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

const PORT = 3100

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  // Mobile first: most people play on a phone.
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: `pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
