import { neon } from '@neondatabase/serverless'
import { expect, test, type Page } from '@playwright/test'
import es from '../messages/es.json' with { type: 'json' }
import { SAMPLE_GAME } from '../src/features/games/sample-game'

const m = es.Match
const o = es.Online

// Matches created here live in the real database: remove them afterwards.
const codes: string[] = []
test.afterAll(async () => {
  if (!process.env.DATABASE_URL || codes.length === 0) return
  const sql = neon(process.env.DATABASE_URL)
  await sql`delete from matches where code = any(${codes})`
})

function wrongOption(questionText: string): string {
  const q = SAMPLE_GAME.questions.find(x => x.text === questionText)
  if (!q) throw new Error(`Unknown question: ${questionText}`)
  return q.options[(q.correctIndex + 1) % 4] as string
}

/** Plays the current turn until missing a question (turn passes). */
async function playUntilMiss(page: Page, rival: string) {
  const waiting = page.getByRole('heading', {
    name: o.turn.theirTurn.replace('{name}', rival),
  })
  for (let step = 0; step < 40; step++) {
    if (await waiting.isVisible()) return
    const start = page.getByRole('button', { name: o.turn.start })
    if (await start.isVisible()) {
      await start.click()
      await expect(start).toBeHidden()
      continue
    }
    const spin = page
      .getByRole('button', { name: m.spin.button, exact: true })
      .last()
    if (await spin.isVisible()) {
      await spin.click()
      await expect(
        page.getByRole('button', { name: m.reveal.continue }),
      ).toBeVisible({ timeout: 15_000 })
      continue
    }
    const cont = page.getByRole('button', { name: m.reveal.continue })
    if (await cont.isVisible()) {
      await cont.click()
      await expect(cont).toBeHidden()
      continue
    }
    const playFor = page.getByRole('button', {
      name: new RegExp(m.choose.playFor),
    })
    if (await playFor.isVisible()) {
      await playFor.click()
      await page.locator('ul.grid button').first().click()
      await expect(page.locator('main ul li button')).toHaveCount(4)
      continue
    }
    const options = page.locator('main ul li button')
    if ((await options.count()) === 4 && (await options.first().isEnabled())) {
      const text = (await page.locator('main h2').first().textContent()) ?? ''
      await page
        .getByRole('button', { name: wrongOption(text), exact: true })
        .click()
      await expect(page.getByText(m.question.incorrect)).toBeVisible()
      await page.getByRole('button', { name: m.question.continue }).click()
      await expect(page.getByText(m.question.incorrect)).toBeHidden()
      continue
    }
    await page.waitForTimeout(300)
  }
  await expect(waiting).toBeVisible()
}

test('two devices: invite, join and alternate turns', async ({ browser }) => {
  test.setTimeout(180_000)
  const ana = await (await browser.newContext()).newPage()
  const beto = await (await browser.newContext()).newPage()

  // Ana creates an online match for the demo game.
  await ana.goto('/j/demo')
  await ana.evaluate(() => localStorage.clear())
  await ana.reload()
  await ana.getByRole('radio', { name: o.setup.modeOnline }).click()
  await ana.getByLabel(o.setup.yourName).fill('Ana')
  await ana.getByRole('button', { name: o.setup.create }).click()
  await ana.waitForURL(/\/p\/[a-z0-9]{8}$/)
  const code = ana.url().split('/p/')[1] ?? ''
  codes.push(code)
  await expect(ana.getByRole('heading', { name: o.invite.title })).toBeVisible()
  const invite = await ana.getByLabel(o.invite.link).inputValue()
  expect(invite).toMatch(new RegExp(`/p/${code}$`))
  await ana.screenshot({ path: 'test-results/screens/20-online-invite.png' })

  // Beto opens the invite and joins; Ana starts, so he waits.
  await beto.goto(invite)
  await expect(
    beto.getByRole('heading', { name: o.join.title.replace('{name}', 'Ana') }),
  ).toBeVisible()
  await beto.getByLabel(o.join.yourName).fill('Beto')
  await beto.getByRole('button', { name: o.join.join }).click()
  await expect(
    beto.getByRole('heading', {
      name: o.turn.theirTurn.replace('{name}', 'Ana'),
    }),
  ).toBeVisible()
  await beto.screenshot({ path: 'test-results/screens/21-online-waiting.png' })

  // Ana's screen notices Beto joined, without reloading.
  await expect(ana.getByRole('heading', { name: o.turn.yourTurn })).toBeVisible(
    { timeout: 15_000 },
  )
  await ana.screenshot({
    path: 'test-results/screens/22-online-your-turn.png',
  })
  await ana.getByRole('button', { name: o.turn.start }).click()

  // Nothing the browser can read reveals answers ahead of time.
  await ana
    .getByRole('button', { name: m.spin.button, exact: true })
    .last()
    .click()
  await expect(
    ana.getByRole('button', { name: m.reveal.continue }),
  ).toBeVisible({ timeout: 15_000 })
  await ana.getByRole('button', { name: m.reveal.continue }).click()
  const playFor = ana.getByRole('button', {
    name: new RegExp(m.choose.playFor),
  })
  // The server answers with either the question or (crown) the prize choice.
  await expect(
    playFor.or(ana.locator('main ul li button').first()),
  ).toBeVisible()
  if (await playFor.isVisible()) {
    await playFor.click()
    await ana.locator('ul.grid button').first().click()
  }
  await expect(ana.locator('main ul li button')).toHaveCount(4)
  const api = await ana.request.get(`/api/matches/${code}`)
  const { view } = (await api.json()) as {
    view: { state: { game: { questions: { correctIndex: number }[] } } }
  }
  expect(view.state.game.questions).toHaveLength(1)
  expect(view.state.game.questions[0]?.correctIndex).toBe(-1)

  // Ana plays until she misses; then it's Beto's turn on his screen.
  await playUntilMiss(ana, 'Beto')
  await expect(
    beto.getByRole('heading', { name: o.turn.yourTurn }),
  ).toBeVisible({ timeout: 15_000 })
  await playUntilMiss(beto, 'Ana')
  await expect(ana.getByRole('heading', { name: o.turn.yourTurn })).toBeVisible(
    { timeout: 15_000 },
  )

  // Ana finds the match on the home page.
  await ana.goto('/')
  await expect(ana.getByRole('heading', { name: o.home.title })).toBeVisible()
  await expect(
    ana.getByRole('link', {
      name: o.home.open.replace('{title}', SAMPLE_GAME.title),
    }),
  ).toContainText(o.home.yourTurn)
  await ana.screenshot({ path: 'test-results/screens/23-home-my-matches.png' })

  // A third person with the same link can't take a seat.
  const third = await (await browser.newContext()).newPage()
  await third.goto(invite)
  await expect(third.getByRole('heading', { name: o.join.full })).toBeVisible()
})
