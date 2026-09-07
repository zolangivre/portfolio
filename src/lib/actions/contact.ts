'use server'

import { createMessage } from '@/lib/queries/messages'

export type ContactFormState = {
  error?: string
  success: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mirrors the maxLength on the Messages collection. Enforced here too so an
// over-long value is rejected with a form error instead of surfacing as a
// Payload validation exception caught as a generic 'server-error'.
const LIMITS = { email: 254, message: 5000, name: 120 } as const

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot: real visitors never fill this hidden field.
  const honeypot = String(formData.get('company') ?? '')
  if (honeypot.trim().length > 0) {
    return { success: true }
  }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()

  if (!name || !email || !message) {
    return { error: 'missing-fields', success: false }
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: 'invalid-email', success: false }
  }

  if (name.length > LIMITS.name || email.length > LIMITS.email || message.length > LIMITS.message) {
    return { error: 'missing-fields', success: false }
  }

  const result = await createMessage({ email, message, name })

  if (!result.success) {
    return { error: 'server-error', success: false }
  }

  return { success: true }
}
