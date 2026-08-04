import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

/**
 * Enables Next.js draft mode, then redirects to the real page.
 *
 * Payload's "Preview" button and Live Preview both point here. Draft mode is
 * gated on a valid Payload session: without it, anyone with the URL could read
 * unpublished content.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  const collection = searchParams.get('collection')
  const slug = searchParams.get('slug')

  if (!path || !collection || !slug) {
    return new Response('Missing required parameters.', { status: 400 })
  }

  // Only ever redirect to a path on this site — an absolute URL here would let
  // this route be used as an open redirect.
  if (!path.startsWith('/')) {
    return new Response('Invalid path.', { status: 400 })
  }

  const payload = await getPayload({ config: await configPromise })
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (!user) {
    return new Response('You are not allowed to preview this page.', { status: 403 })
  }

  // Confirm the document actually exists before flipping draft mode on, so a
  // bad link gives a clear error instead of a confusing 404 in preview.
  const doc = await payload.find({
    collection: collection as 'projects' | 'journal',
    depth: 0,
    draft: true,
    limit: 1,
    where: { slug: { equals: slug } },
  })

  if (!doc.docs.length) {
    return new Response('Document not found.', { status: 404 })
  }

  const draft = await draftMode()
  draft.enable()

  redirect(path)
}
