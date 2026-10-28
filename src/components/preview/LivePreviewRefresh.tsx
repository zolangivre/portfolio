'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

/**
 * Re-renders the page each time the admin saves or autosaves the document
 * being previewed. The page itself reads the draft on the server (Draft
 * Mode); this only listens for Payload's "saved" message and refreshes.
 */
export function LivePreviewRefresh() {
  const router = useRouter()

  return (
    <RefreshRouteOnSave
      refresh={() => router.refresh()}
      serverURL={typeof window === 'undefined' ? '' : window.location.origin}
    />
  )
}
