import type { CollectionAfterChangeHook } from 'payload'

/**
 * Emails a notification when the contact form produces a new message.
 *
 * Without this, a message only lands in the `messages` collection and is seen
 * whenever the admin panel is next opened. Delivery goes through Resend's HTTP
 * API rather than an SMTP adapter so it needs no extra dependency, and the
 * whole thing is inert until `RESEND_API_KEY` is set — local development and
 * any deploy without the key keep working exactly as before.
 *
 * Environment:
 *   RESEND_API_KEY             enables the hook
 *   CONTACT_NOTIFICATION_FROM  sender, on a domain verified with Resend
 *   CONTACT_NOTIFICATION_TO    recipient (defaults to Global Settings → contact email)
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const notifyNewMessage: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') {
    return doc
  }

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return doc
  }

  // A failure here must never surface to the visitor: the message is already
  // stored, so a bounced notification is an operational problem, not a failed
  // submission.
  try {
    const from = process.env.CONTACT_NOTIFICATION_FROM

    if (!from) {
      req.payload.logger.warn(
        'RESEND_API_KEY is set but CONTACT_NOTIFICATION_FROM is missing — skipping the contact notification.',
      )

      return doc
    }

    let to = process.env.CONTACT_NOTIFICATION_TO

    if (!to) {
      const settings = await req.payload.findGlobal({ slug: 'settings', depth: 0 })
      to = settings?.contactEmail ?? undefined
    }

    if (!to) {
      req.payload.logger.warn(
        'No recipient for the contact notification (set CONTACT_NOTIFICATION_TO or a contact email in Global Settings).',
      )

      return doc
    }

    const name = String(doc.name ?? '')
    const email = String(doc.email ?? '')
    const message = String(doc.message ?? '')

    const response = await fetch(RESEND_ENDPOINT, {
      body: JSON.stringify({
        from,
        to: [to],
        // Replying to the notification replies to the visitor directly.
        reply_to: email,
        subject: `Nouveau message de ${name}`,
        html: [
          `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>`,
          `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
        ].join(''),
        text: `${name} <${email}>\n\n${message}`,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      req.payload.logger.error(
        `Contact notification rejected by Resend (${response.status}): ${await response.text()}`,
      )
    }
  } catch (error) {
    req.payload.logger.error({ err: error }, 'Failed to send the contact notification.')
  }

  return doc
}
