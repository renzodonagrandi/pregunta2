import { expect, test, type Page } from '@playwright/test'
import es from '../messages/es.json' with { type: 'json' }
import { SAMPLE_GAME } from '../src/features/games/sample-game'

const m = es.Match

function correctOption(questionText: string): string {
  const q = SAMPLE_GAME.questions.find(x => x.text === questionText)
  if (!q) throw new Error(`Unknown question: ${questionText}`)
  return q.options[q.correctIndex] as string
}

function wrongOption(questionText: string): string {
  const q = SAMPLE_GAME.questions.find(x => x.text === questionText)
  if (!q) throw new Error(`Unknown question: ${questionText}`)
  return q.options[(q.correctIndex + 1) % 4] as string
}

async function startMatch(page: Page) {
  await page.goto('/j/demo')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: m.setup.title })).toBeVisible()
  await page.getByLabel(m.setup.player1).fill('Ana')
  await page.getByLabel(m.setup.player2).fill('Beto')
  await page.getByRole('button', { name: m.setup.start }).click()
  await expect(page.getByRole('heading', { name: 'Turno de Ana' })).toBeVisible()
  await page.getByRole('button', { name: m.turn.ready }).click()
}

async function spin(page: Page) {
  await page.getByRole('button', { name: m.spin.button, exact: true }).last().click()
  await expect(page.getByRole('button', { name: m.reveal.continue })).toBeVisible({ timeout: 10_000 })
}

test('validates player names before starting', async ({ page }) => {
  await page.goto('/j/demo')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: m.setup.start }).click()
  await expect(page.getByText(m.setup.nameError.replace('{max}', '24')).first()).toBeVisible()
})

test('plays a full match until someone wins, then rematch', async ({ page }) => {
  await startMatch(page)
  await page.screenshot({ path: 'test-results/screens/01-spin.png' })

  // Ana always answers right, so she keeps the turn and must win eventually.
  for (let step = 0; step < 200; step++) {
    const heading = page.getByRole('heading').first()
    if (await page.getByRole('button', { name: m.finished.rematch }).isVisible()) break

    if (await page.getByRole('button', { name: m.reveal.continue }).isVisible()) {
      if (step < 3) await page.screenshot({ path: `test-results/screens/02-reveal-${step}.png` })
      await page.getByRole('button', { name: m.reveal.continue }).click()
      continue
    }
    if (await page.getByRole('button', { name: m.choose.playFor }).isVisible()) {
      await page.screenshot({ path: 'test-results/screens/04-choose.png' })
      await page.getByRole('button', { name: m.choose.playFor }).click()
      await page.locator('ul.grid button').first().click()
      continue
    }
    const options = page.locator('main ul li button')
    if ((await options.count()) === 4 && (await options.first().isEnabled())) {
      const text = (await page.locator('main h2').first().textContent()) ?? ''
      await page.getByRole('button', { name: correctOption(text), exact: true }).click()
      await expect(page.getByText(m.question.correct)).toBeVisible()
      if (step < 4) await page.screenshot({ path: `test-results/screens/03-answer-${step}.png` })
      await page.getByRole('button', { name: m.question.continue }).click()
      continue
    }
    if (await page.getByRole('button', { name: m.spin.button, exact: true }).last().isVisible()) {
      await spin(page)
      continue
    }
    throw new Error(`Unexpected screen: ${await heading.textContent()}`)
  }

  await expect(page.getByRole('heading', { name: '¡Ganó Ana!' })).toBeVisible()
  await page.screenshot({ path: 'test-results/screens/05-finished.png' })
  await page.getByRole('button', { name: m.finished.rematch }).click()
  await expect(page.getByRole('heading', { name: 'Turno de Ana' })).toBeVisible()
})

test('a wrong answer passes the turn and the match survives a reload', async ({ page }) => {
  await startMatch(page)
  // Spin until a category comes up (skip crowns by playing for a category and failing).
  for (;;) {
    await spin(page)
    await page.getByRole('button', { name: m.reveal.continue }).click()
    if (await page.getByRole('button', { name: m.choose.playFor }).isVisible()) {
      await page.getByRole('button', { name: m.choose.playFor }).click()
      await page.locator('ul.grid button').first().click()
    }
    break
  }
  const text = (await page.locator('main h2').first().textContent()) ?? ''
  await page.getByRole('button', { name: wrongOption(text), exact: true }).click()
  await expect(page.getByText(m.question.incorrect)).toBeVisible()
  await expect(page.getByText(`La respuesta correcta era: ${correctOption(text)}`)).toBeVisible()
  await page.screenshot({ path: 'test-results/screens/06-wrong.png' })
  await page.getByRole('button', { name: m.question.continue }).click()
  await expect(page.getByRole('heading', { name: 'Turno de Beto' })).toBeVisible()
  await page.screenshot({ path: 'test-results/screens/07-turn-change.png' })

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Turno de Beto' })).toBeVisible()
})
