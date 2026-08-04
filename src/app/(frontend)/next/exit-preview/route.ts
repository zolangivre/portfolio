import { draftMode } from 'next/headers'

/** Turns draft mode back off, returning the browser to the published site. */
export async function GET(): Promise<Response> {
  const draft = await draftMode()
  draft.disable()

  return new Response('Draft mode is disabled.', { status: 200 })
}
