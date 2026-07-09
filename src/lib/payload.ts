import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

export const getPayloadClient = cache(async () => {
  const config = await configPromise

  return getPayload({ config })
})
