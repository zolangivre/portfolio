'use server'

import { createMessage } from '@/lib/queries/messages'

export type ContactField = 'name' | 'email' | 'message'

export type ContactFormState = {
  error?: string
  /** The field the error is about, so the form can mark and focus it. */
  field?: ContactField
  success: boolean
  /**
   * What the visitor typed, sent back on error: React resets a form once its
   * action settles, so without this a rejected message would be wiped.
   */
  values?: Record<ContactField, string>
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

  const values = { email, message, name }
  const fail = (error: string, field?: ContactField): ContactFormState => ({
    error,
    field,
    success: false,
    values,
  })

  const missing = (['name', 'email', 'message'] as const).find((field) => !values[field])

  if (missing) {
    return fail('missing-fields', missing)
  }

  if (!EMAIL_PATTERN.test(email)) {
    return fail('invalid-email', 'email')
  }

  const overLong = (['name', 'email', 'message'] as const).find(
    (field) => values[field].length > LIMITS[field],
  )

  if (overLong) {
    return fail('missing-fields', overLong)
  }

  const result = await createMessage({ email, message, name })

  if (!result.success) {
    return fail('server-error')
  }

  return { success: true }
}
