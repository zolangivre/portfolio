import { draftMode } from 'next/headers'

import { isSafePreviewPath } from '@/lib/preview'

/**
 * Leaves Draft Mode (the preview banner's form) and goes back to the page,
 * now as visitors see it. A POST, since it changes what the next requests
 * render.
 */
export async function POST(request: Request) {
  const path = (await request.formData()).get('path')

  ;(await draftMode()).disable()

  // 303: the browser follows with a GET, not a repeat of the POST.
  return new Response(null, {
    headers: { Location: isSafePreviewPath(path) ? path : '/' },
    status: 303,
  })
}
