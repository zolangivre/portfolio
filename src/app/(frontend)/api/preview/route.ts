import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { getPayloadClient } from '@/lib/payload'
import { isSafePreviewPath } from '@/lib/preview'

/**
 * The Live Preview iframe's entry point: turns on Draft Mode for a logged-in
 * editor, then shows the page. Draft Mode only reads drafts — the admin
 * session is what proves the request may.
 */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path')

  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return new Response('Log in to the admin to preview drafts.', { status: 401 })
  }

  if (!isSafePreviewPath(path)) {
    return new Response('Invalid preview path.', { status: 400 })
  }

  ;(await draftMode()).enable()

  redirect(path)
}
