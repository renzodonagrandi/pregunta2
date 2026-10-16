import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from '@/features/games/constants'
import { findGameByToken } from '@/features/games/queries'
import {
  categoryImagePathname,
  questionImagePathname,
  uploadPayloadSchema,
} from '@/features/games/schemas'
import { categories } from '@/features/games/schema'
import { getDb } from '@/lib/db'
import { blobToken } from '@/lib/env'
import { and, eq } from 'drizzle-orm'

/**
 * Issues short-lived client-upload tokens for category images. The browser
 * uploads straight to Vercel Blob (function bodies are size-limited); we only
 * sign exact pathnames inside the game the edit token owns.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody
  try {
    const result = await handleUpload({
      body,
      request,
      token: blobToken(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = uploadPayloadSchema.safeParse(
          JSON.parse(clientPayload ?? 'null'),
        )
        if (!payload.success) throw new Error('Invalid payload')
        const game = await findGameByToken(payload.data.token)
        if (!game) throw new Error('Invalid token')
        let expected: string
        if (payload.data.kind === 'category') {
          const [category] = await getDb()
            .select({ id: categories.id })
            .from(categories)
            .where(
              and(
                eq(categories.id, payload.data.categoryId),
                eq(categories.gameId, game.id),
              ),
            )
            .limit(1)
          if (!category) throw new Error('Unknown category')
          expected = categoryImagePathname(game.id, category.id)
        } else {
          expected = questionImagePathname(game.id)
        }
        if (pathname !== expected) throw new Error('Invalid pathname')
        return {
          allowedContentTypes: ALLOWED_IMAGE_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          // A fresh URL per upload, so CDN caches never serve the old image.
          addRandomSuffix: true,
        }
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 },
    )
  }
}
