import { expect, test } from '@playwright/test'

import { loginAsEditor } from './api'
import { projects } from './fixtures'

/**
 * Old URLs on the production build: a page about to answer 404 looks for a
 * redirect first (lib/queries/redirects.ts), and that answer is cached with
 * the page, so a redirect created or deleted later has to reach it through
 * the cache tags. Each check is made on the first request after the save.
 */

const gamma = projects[2]!

test('a renamed project’s old URL leads to its new one', async ({ page, request }) => {
  const admin = await loginAsEditor(request)
  const {
    docs: [project],
  } = await admin.find('projects', { slug: { equals: gamma.slug } })
  const renamed = `${gamma.slug}-renamed`

  await admin.update('projects', project!.id, { _status: 'published', slug: renamed })

  try {
    for (const locale of ['fr', 'en'] as const) {
      await page.goto(`/${locale}/projects/${gamma.slug}`)
      await expect(page).toHaveURL(`/${locale}/projects/${renamed}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(gamma[locale])
    }
  } finally {
    await admin.update('projects', project!.id, { _status: 'published', slug: gamma.slug })
    const { docs } = await admin.find('redirects', { from: { like: gamma.slug } })
    for (const { id } of docs) await admin.remove('redirects', id)
  }
})

test('a redirect typed in the admin turns a 404 into a visit, until it is deleted', async ({
  page,
  request,
}) => {
  const admin = await loginAsEditor(request)
  const oldPath = '/fr/e2e-ancienne-page'

  // Rendered once as a 404 first, so the redirect has a cached page to beat.
  expect((await request.get(oldPath)).status()).toBe(404)

  const redirect = await admin.create('redirects', {
    from: '/e2e-ancienne-page',
    to: { type: 'custom', url: '/fr/journal' },
  })

  try {
    await page.goto(oldPath)
    await expect(page).toHaveURL('/fr/journal')
  } finally {
    await admin.remove('redirects', redirect.id)
  }

  expect((await request.get(oldPath)).status()).toBe(404)
})
