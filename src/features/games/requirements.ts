import { MAX_CATEGORIES, MIN_CATEGORIES } from '@/features/match/engine'
import { MIN_QUESTIONS_TO_PUBLISH } from './constants'
import type { EditorGame } from './types'

export type PublishIssue =
  | { code: 'TITLE_MISSING' }
  | { code: 'CATEGORY_COUNT'; count: number }
  | { code: 'CATEGORY_NAME_MISSING'; position: number }
  | {
      code: 'NOT_ENOUGH_QUESTIONS'
      categoryId: string
      name: string
      count: number
    }

/** What is still missing before the game can be published. */
export function publishIssues(game: EditorGame): PublishIssue[] {
  const issues: PublishIssue[] = []
  if (game.title.trim().length === 0) issues.push({ code: 'TITLE_MISSING' })
  const count = game.categories.length
  if (count < MIN_CATEGORIES || count > MAX_CATEGORIES) {
    issues.push({ code: 'CATEGORY_COUNT', count })
  }
  game.categories.forEach((c, i) => {
    if (c.name.trim().length === 0) {
      issues.push({ code: 'CATEGORY_NAME_MISSING', position: i + 1 })
    }
    if (c.questions.length < MIN_QUESTIONS_TO_PUBLISH) {
      issues.push({
        code: 'NOT_ENOUGH_QUESTIONS',
        categoryId: c.id,
        name: c.name,
        count: c.questions.length,
      })
    }
  })
  return issues
}
