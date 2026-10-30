'use client'

import { captureException } from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

/**
 * An error in a root layout, where no error.tsx can catch it. The page stays
 * the one Next shows by default: this only reports the error.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    captureException(error)
  }, [error])

  return (
    <html lang="fr">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
