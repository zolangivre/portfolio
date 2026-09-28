import { getPayload, type CollectionSlug, type GlobalSlug, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import configPromise from '@/payload.config'

/**
 * The database was built from the migrations alone (PAYLOAD_DB_PUSH=false),
 * and migrations here are written by hand. Reading every collection and
 * global in every locale selects each table and column the config expects —
 * main, `_locales`, `_rels`, arrays and blocks — so a migration that forgot
 * one fails here instead of on the first production deploy.
 */
const config = await configPromise
const collections = config.collections.map((collection) => collection.slug as CollectionSlug)
const globals = config.globals.map((global) => global.slug as GlobalSlug)

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  await payload?.destroy()
})

describe('schema built from migrations', () => {
  it.each(collections)('reads the %s collection', async (collection) => {
    const result = await payload.find({ collection, depth: 0, limit: 1, locale: 'all' })

    expect(result.docs).toBeInstanceOf(Array)
  })

  it.each(globals)('reads the %s global', async (slug) => {
    const result = await payload.findGlobal({ slug, depth: 0, locale: 'all' })

    expect(result).toBeTypeOf('object')
  })
})
