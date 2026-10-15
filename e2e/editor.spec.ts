import { neon } from '@neondatabase/serverless'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { del } from '@vercel/blob'
import es from '../messages/es.json' with { type: 'json' }

const e = es.Editor
const CATEGORY_NAMES = ['Historia', 'Música', 'Cine']

// Games created here live in the real database: remove them afterwards so
// they never show up on the home page.
const createdTitles: string[] = []

test.afterAll(async () => {
  const url = process.env.DATABASE_URL
  if (!url || createdTitles.length === 0) return
  const sql = neon(url)
  for (const title of createdTitles) {
    const images = (await sql`
      select c.image_url from categories c join games g on g.id = c.game_id
      where g.title = ${title} and c.image_url is not null`) as {
      image_url: string
    }[]
    if (images.length > 0) {
      await del(
        images.map(i => i.image_url),
        { token: process.env.BLOB_READ_WRITE_TOKEN ?? '' },
      )
    }
    await sql`delete from games where title = ${title}`
  }
})

async function waitSaved(page: Page) {
  await expect(
    page.getByRole('status').filter({ hasText: e.status.saved }),
  ).toBeVisible()
}

async function addQuestion(page: Page, text: string, correct: number) {
  await page.getByRole('button', { name: `+ ${e.questions.add}` }).click()
  const form = page
    .locator('form')
    .filter({ has: page.getByPlaceholder(e.questions.textPlaceholder) })
  await form.getByPlaceholder(e.questions.textPlaceholder).fill(text)
  for (let i = 0; i < 4; i++) {
    await form
      .getByPlaceholder(`Opción ${i + 1}`)
      .fill(`${text} opción ${i + 1}`)
  }
  await form.getByLabel(`Marcar la opción ${correct + 1} como correcta`).check()
  await form.getByRole('button', { name: e.questions.save }).click()
  await expect(
    page.getByText(`Correcta: ${text} opción ${correct + 1}`),
  ).toBeVisible()
}

function card(page: Page, index: number): Locator {
  return page.locator('article').nth(index)
}

test('create, edit, upload an image, publish and play a game', async ({
  page,
}) => {
  test.setTimeout(240_000)
  const title = `Juego E2E ${Date.now()}`
  createdTitles.push(title)

  // Create a draft from the home page.
  await page.goto('/')
  await page.getByRole('button', { name: es.Home.create }).click()
  await page.waitForURL(/\/edit\/[A-Za-z0-9_-]{43}/)
  const editUrl = page.url()

  // Step 1: title and three categories.
  await page.getByLabel(e.meta.title).fill(title)
  await page.getByLabel(e.meta.title).blur()
  await waitSaved(page)
  await expect(page.locator('article')).toHaveCount(3)

  for (const [i, name] of CATEGORY_NAMES.entries()) {
    const input = card(page, i).getByPlaceholder(e.categories.namePlaceholder)
    await input.fill(name)
    // The wheel preview follows the typed name before it is saved.
    await expect(
      page.getByRole('img', { name: e.categories.preview }),
    ).toContainText(name.charAt(0))
    await input.blur()
    await expect(
      page.getByRole('status').filter({ hasText: e.status.saving }),
    ).toHaveCount(0)
  }
  await waitSaved(page)

  // Colors used by other categories are disabled.
  await expect(
    card(page, 0).getByRole('button', { name: /ya lo usa otro macaco/ }),
  ).toHaveCount(2)
  for (const b of await card(page, 0)
    .getByRole('button', { name: /ya lo usa otro macaco/ })
    .all()) {
    await expect(b).toBeDisabled()
  }

  // Change a color to a free one.
  await card(page, 2).getByRole('button', { name: 'Color #6A1B9A' }).click()
  await waitSaved(page)
  await expect(
    card(page, 0).getByRole('button', {
      name: '#6A1B9A: ya lo usa otro macaco',
    }),
  ).toBeDisabled()

  // Image: compressed in the browser and uploaded to Vercel Blob.
  await card(page, 0)
    .locator('input[type=file]')
    .setInputFiles('e2e/fixtures/category.png')
  const img = card(page, 0).locator('img')
  await expect(img).toBeVisible({ timeout: 30_000 })
  const src = (await img.getAttribute('src')) ?? ''
  expect(src).toMatch(
    /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/categories\/.+\.webp$/,
  )
  const imageResponse = await page.request.get(src)
  expect(imageResponse.ok()).toBe(true)
  expect(imageResponse.headers()['content-type']).toBe('image/webp')
  expect((await imageResponse.body()).length).toBeLessThan(300_000)
  await page.screenshot({
    path: 'test-results/screens/10-editor-categories.png',
    fullPage: true,
  })

  // Publishing is blocked until there are 5 questions per category.
  await page.getByRole('tab', { name: e.tabs.publish }).click()
  await expect(
    page.getByText('Historia necesita al menos 5 preguntas (tiene 0).'),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: e.publish.button }),
  ).toBeDisabled()

  // Step 2: questions for every category.
  await page.getByRole('tab', { name: e.tabs.questions }).click()
  for (const name of CATEGORY_NAMES) {
    await page.getByRole('tab', { name: new RegExp(name) }).click()
    for (let q = 0; q < 5; q++)
      await addQuestion(page, `${name} ${q + 1}`, q % 4)
    await expect(
      page.getByRole('tab', { name: new RegExp(`${name}.*5/5`) }),
    ).toBeVisible()
  }
  await page.screenshot({
    path: 'test-results/screens/11-editor-questions.png',
    fullPage: true,
  })

  // Edit and delete a question.
  await page.getByRole('button', { name: e.questions.edit }).first().click()
  await page
    .getByPlaceholder(e.questions.textPlaceholder)
    .fill('Cine 1 editada')
  await page.getByRole('button', { name: e.questions.save }).click()
  await expect(page.getByText('Cine 1 editada')).toBeVisible()

  // Publish and get both links.
  await page.getByRole('tab', { name: e.tabs.publish }).click()
  await expect(page.getByText(e.publish.ready)).toBeVisible()
  await page.getByRole('button', { name: e.publish.button }).click()
  await expect(page.getByText(e.publish.publishedTitle)).toBeVisible()
  const playLink = await page.getByLabel(e.publish.publicLink).inputValue()
  const editLink = await page
    .locator('section')
    .getByLabel(e.publish.editLink)
    .inputValue()
  expect(playLink).toMatch(/\/j\/juego-e2e-\d+-[a-z0-9]{5}$/)
  expect(editLink).toBe(editUrl.split('?')[0])
  await expect(page.getByText(e.publish.editWarning)).toBeVisible()
  await page.screenshot({
    path: 'test-results/screens/12-editor-published.png',
    fullPage: true,
  })

  // The home lists it, and the public link plays it.
  await page.goto('/')
  await expect(page.getByRole('link', { name: `Jugar ${title}` })).toBeVisible()
  await page.goto(playLink)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await page.getByLabel(es.Match.setup.player1).fill('Ana')
  await page.getByLabel(es.Match.setup.player2).fill('Beto')
  await page.getByRole('button', { name: es.Match.setup.start }).click()
  await page.getByRole('button', { name: es.Match.turn.ready }).click()
  await expect(
    page.getByRole('img', { name: 'Ruleta con 4 porciones' }),
  ).toBeVisible()
  await expect(page.locator('main img, section img').first()).toBeVisible()

  // Breaking the requirements of a published game sends it back to draft.
  await page.goto(`${editUrl.split('?')[0]}?tab=questions`)
  // A fresh load of a published game shows it as published.
  await expect(page.getByText(e.published, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: e.questions.delete }).first().click()
  await page.getByRole('button', { name: e.questions.confirmDelete }).click()
  await expect(page.getByText(e.publish.backToDraft)).toBeVisible()
  // Streamed (PPR) not-found pages keep status 200 but render the 404 UI.
  await page.goto(playLink)
  await expect(
    page.getByRole('heading', { name: es.Errors.notFoundTitle }),
  ).toBeVisible()
})

test('an invalid edit token shows the not-found page', async ({ page }) => {
  await page.goto(`/edit/${'x'.repeat(43)}`)
  await expect(
    page.getByRole('heading', { name: es.Errors.notFoundTitle }),
  ).toBeVisible()
  await page.goto('/edit/nope')
  await expect(
    page.getByRole('heading', { name: es.Errors.notFoundTitle }),
  ).toBeVisible()
})

test('the upload route refuses to sign without a valid edit token', async ({
  request,
}) => {
  const res = await request.post('/api/blob/upload', {
    data: {
      type: 'blob.generate-client-token',
      payload: {
        pathname: 'categories/x/y.webp',
        clientPayload: JSON.stringify({
          token: 'a'.repeat(43),
          categoryId: '00000000-0000-4000-8000-000000000000',
        }),
        multipart: false,
      },
    },
  })
  expect(res.status()).toBe(400)
})
