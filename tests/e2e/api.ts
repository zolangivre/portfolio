import { expect, type APIRequestContext } from '@playwright/test'

import { editor } from './fixtures'

/**
 * Edits go through the REST API, as the admin panel's would: that runs the
 * afterChange hooks inside a Next request, which is the only place
 * revalidateTag can reach the cache. A Local API call from the test process
 * would change the database and leave every page stale.
 */
export async function loginAsEditor(request: APIRequestContext) {
  const response = await request.post('/api/users/login', { data: editor })
  expect(response.ok(), await response.text()).toBe(true)

  const { token } = (await response.json()) as { token: string }
  const headers = { Authorization: `JWT ${token}` }

  return {
    async find(collection: string, where: Record<string, unknown>) {
      const params = new URLSearchParams({ depth: '0' })
      for (const [field, condition] of Object.entries(where)) {
        for (const [operator, value] of Object.entries(condition as Record<string, string>)) {
          params.set(`where[${field}][${operator}]`, value)
        }
      }

      const response = await request.get(`/api/${collection}?${params}`, { headers })
      expect(response.ok(), await response.text()).toBe(true)

      return (await response.json()) as { docs: { id: number }[]; totalDocs: number }
    },

    async update(collection: string, id: number, data: object, locale = 'fr') {
      const response = await request.patch(`/api/${collection}/${id}?locale=${locale}`, {
        data,
        headers,
      })
      expect(response.ok(), await response.text()).toBe(true)
    },

    async updateGlobal(slug: string, data: object) {
      const response = await request.post(`/api/globals/${slug}`, { data, headers })
      expect(response.ok(), await response.text()).toBe(true)
    },
  }
}
