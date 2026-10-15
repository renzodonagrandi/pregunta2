import { describe, expect, it } from 'vitest'
import { publishIssues } from './requirements'
import type { EditorCategory, EditorGame } from './types'

function category(id: string, name: string, questions: number): EditorCategory {
  return {
    id,
    name,
    color: '#C62828',
    imageUrl: null,
    questions: Array.from({ length: questions }, (_, i) => ({
      id: `${id}${i}`,
      text: 'q',
      options: ['a', 'b', 'c', 'd'],
      correctIndex: 0,
    })),
  }
}

function game(categories: EditorCategory[], title = 'Juego'): EditorGame {
  return {
    id: 'g',
    slug: 's',
    title,
    published: false,
    categories,
  }
}

describe('publish requirements', () => {
  it('passes with 3 named categories and 5 questions each', () => {
    expect(
      publishIssues(
        game([
          category('a', 'A', 5),
          category('b', 'B', 5),
          category('c', 'C', 7),
        ]),
      ),
    ).toEqual([])
  })

  it('reports every missing piece', () => {
    const issues = publishIssues(
      game([category('a', '', 5), category('b', 'B', 2)], ' '),
    )
    expect(issues).toEqual([
      { code: 'TITLE_MISSING' },
      { code: 'CATEGORY_COUNT', count: 2 },
      { code: 'CATEGORY_NAME_MISSING', position: 1 },
      { code: 'NOT_ENOUGH_QUESTIONS', categoryId: 'b', name: 'B', count: 2 },
    ])
  })

  it('rejects more than 6 categories', () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      category(`c${i}`, `C${i}`, 5),
    )
    expect(publishIssues(game(many))).toEqual([
      { code: 'CATEGORY_COUNT', count: 7 },
    ])
  })
})
