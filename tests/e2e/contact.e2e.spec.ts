import { expect, test } from '@playwright/test'

import { loginAsEditor } from './api'
import { contactSuccess } from './fixtures'

test('a visitor can send a message, and it lands in the admin', async ({ page, request }) => {
  // Unique per run, so the lookup below can't match an earlier message.
  const email = `visitor-${Date.now()}@example.com`

  await page.goto('/fr#contact')

  const form = page.locator('#contact form')
  await form.getByLabel('Nom').fill('E2E Visitor')
  await form.getByLabel('Email').fill(email)
  await form.getByLabel('Message').fill('Hello from the e2e suite.')
  await form.getByRole('button', { name: 'Envoyer' }).click()

  await expect(page.getByRole('status')).toHaveText(contactSuccess.fr)

  const admin = await loginAsEditor(request)
  const { totalDocs } = await admin.find('messages', { email: { equals: email } })

  expect(totalDocs).toBe(1)
})
