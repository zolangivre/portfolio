import { expect, test, type Locator, type Page } from '@playwright/test'

import { journalEntries, privateJournalEntry } from './fixtures'

const expectPressed = async (group: Locator, name: string) => {
  for (const button of await group.getByRole('button').all()) {
    const label = (await button.textContent())?.trim()
    await expect(button, label).toHaveAttribute('aria-pressed', String(label === name))
  }
}

const expectListed = async (page: Page, visible: string[], hidden: string[]) => {
  for (const title of visible) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  }
  for (const title of hidden) {
    await expect(page.getByRole('heading', { name: title })).toHaveCount(0)
  }
}

test('the journal filters entries by category', async ({ page }) => {
  await page.goto('/fr/journal')

  const filter = page.getByRole('group', { name: 'Filtrer les entrées par catégorie' })
  const [first, second] = journalEntries

  await expectPressed(filter, 'Tout')

  await filter.getByRole('button', { name: second.categoryName }).click()
  await expectPressed(filter, second.categoryName)
  await expectListed(page, [second.fr], [first.fr, privateJournalEntry.fr])

  await filter.getByRole('button', { name: first.categoryName }).click()
  // The private entry shares this category and must still stay out.
  await expectListed(page, [first.fr], [second.fr, privateJournalEntry.fr])

  await filter.getByRole('button', { name: 'Tout' }).click()
  await expectListed(page, [first.fr, second.fr], [privateJournalEntry.fr])
})
