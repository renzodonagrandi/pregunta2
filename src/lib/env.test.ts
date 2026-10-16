import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const original = { ...process.env }

async function freshEnv() {
  vi.resetModules()
  return import('./env')
}

afterEach(() => {
  process.env = { ...original }
})

describe('server env', () => {
  it('database access works without Blob credentials', async () => {
    process.env.DATABASE_URL = 'postgresql://u:p@host.neon.tech/db'
    delete process.env.BLOB_READ_WRITE_TOKEN
    const { databaseUrl, blobToken } = await freshEnv()
    expect(databaseUrl()).toBe('postgresql://u:p@host.neon.tech/db')
    expect(() => blobToken()).toThrow(/BLOB_READ_WRITE_TOKEN/)
  })

  it('fails loudly when DATABASE_URL is missing or invalid', async () => {
    delete process.env.DATABASE_URL
    expect((await freshEnv()).databaseUrl).toThrow(/DATABASE_URL/)
    process.env.DATABASE_URL = 'not a url'
    expect((await freshEnv()).databaseUrl).toThrow(/DATABASE_URL/)
  })
})
