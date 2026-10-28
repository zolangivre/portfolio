import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import configPromise from '@/payload.config'

/**
 * Media and videos are sorted into folders in the admin. A folder only sorts:
 * deleting one never deletes a file, wherever that file is (in the folder, in
 * a subfolder, or already in the trash).
 */

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

let payload: Payload
const mediaIds: number[] = []

/** A tiny SVG: media accepts it, and sharp leaves vectors alone. */
const svg = (name: string) => {
  const data = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
  return { data, mimetype: 'image/svg+xml', name, size: data.length }
}

const createMedia = async (alt: string, folder?: number) => {
  const doc = await payload.create({
    collection: 'media',
    data: { alt, folder },
    file: svg(`${alt.replace(/\W+/g, '-')}.svg`),
  })
  mediaIds.push(doc.id)
  return doc
}

const folderOf = async (id: number) =>
  (await payload.findByID({ collection: 'media', depth: 0, id, trash: true })).folder ?? null

beforeAll(async () => {
  payload = await getPayload({ config: configPromise })
})

afterAll(async () => {
  for (const id of mediaIds) {
    await payload.delete({ collection: 'media', id, trash: true }).catch(() => undefined)
  }
  await payload?.destroy()
})

describe('folders', () => {
  it('holds a media file', async () => {
    const folder = await payload.create({
      collection: 'payload-folders',
      data: { name: 'Projets' },
    })
    const media = await createMedia('Folder holds', folder.id)

    expect(await folderOf(media.id)).toBe(folder.id)

    await payload.delete({ collection: 'payload-folders', id: folder.id })
  })

  it('keeps the files when a folder is deleted, moving them to the root', async () => {
    const folder = await payload.create({
      collection: 'payload-folders',
      data: { name: 'Voyages' },
    })
    const sub = await payload.create({
      collection: 'payload-folders',
      data: { folder: folder.id, name: 'Népal' },
    })
    const inFolder = await createMedia('In folder', folder.id)
    const inSub = await createMedia('In subfolder', sub.id)
    const trashed = await createMedia('Trashed in folder', folder.id)
    await payload.update({
      collection: 'media',
      data: { deletedAt: new Date().toISOString() },
      id: trashed.id,
    })

    await payload.delete({ collection: 'payload-folders', id: folder.id })

    const { totalDocs: foldersLeft } = await payload.count({
      collection: 'payload-folders',
      where: { id: { in: [folder.id, sub.id] } },
    })
    expect(foldersLeft).toBe(0)

    for (const media of [inFolder, inSub, trashed]) {
      expect(await folderOf(media.id)).toBeNull()
    }
  })

  it('is closed to visitors', async () => {
    const folder = await payload.create({ collection: 'payload-folders', data: { name: 'Privé' } })

    try {
      const { docs } = await payload.find({ collection: 'payload-folders', overrideAccess: false })
      expect(docs).toEqual([])
    } catch (error) {
      expect((error as Error).name).toBe('Forbidden')
    } finally {
      await payload.delete({ collection: 'payload-folders', id: folder.id })
    }
  })
})
