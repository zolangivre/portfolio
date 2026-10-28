import type { RedirectsPluginConfig } from '@payloadcms/plugin-redirects/types'
import type { CollectionBeforeValidateHook, Field } from 'payload'

import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'
import { normalizeRedirectPath, redirectTargets } from '@/lib/redirects'

/**
 * Settings for Payload's redirects plugin, which builds the `redirects`
 * collection. The site applies them (lib/queries/redirects.ts) only where a
 * page would answer 404; the ones for a renamed project or journal entry are
 * created by hooks/redirectOldSlug.ts.
 */

/** Stores "URL d'origine" as the path the site compares (see normalizeRedirectPath). */
const normalizeFrom: CollectionBeforeValidateHook = ({ data }) => {
  if (data && typeof data.from === 'string') {
    data.from = normalizeRedirectPath(data.from)
  }

  return data
}

export const redirectsConfig: RedirectsPluginConfig = {
  collections: Object.keys(redirectTargets),
  overrides: {
    labels: { singular: 'Redirection', plural: 'Redirections' },
    admin: {
      group: adminGroups.site,
      description:
        'Envoie une ancienne URL du site vers un projet, un article du journal ou une autre URL. Une redirection ne s’applique qu’à une URL qui n’existe plus : elle ne masque jamais une page en ligne. Changer le slug d’un projet ou d’un article publié crée la sienne tout seul.',
      useAsTitle: 'from',
      defaultColumns: ['from', 'to.type', 'updatedAt'],
    },
    access: {
      // The site reads redirects through the Local API; nothing public needs
      // the list.
      read: ({ req }) => Boolean(req.user),
    },
    hooks: {
      beforeValidate: [normalizeFrom],
      afterChange: [revalidateCollectionAfterChange],
      afterDelete: [revalidateCollectionAfterDelete],
    },
    fields: ({ defaultFields }) =>
      defaultFields.map((field) =>
        'name' in field && field.name === 'from'
          ? ({
              ...field,
              admin: {
                ...field.admin,
                description:
                  'Le chemin de l’ancienne URL, par exemple /fr/projects/ancien-slug. Sans /fr ni /en, il vaut pour les deux langues.',
              },
            } as Field)
          : field,
      ),
  },
}
