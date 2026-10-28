import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'

/**
 * A user's MCP API keys go with them: a key's `user` is required, so the
 * database refuses to delete a user who still owns one.
 */
const deleteMcpKeys: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { errors } = await req.payload.delete({
    collection: 'payload-mcp-api-keys',
    overrideAccess: true,
    req,
    where: { user: { equals: id } },
  })

  // A bulk delete reports failures instead of throwing: without this, the
  // user's deletion would fail later on the key's foreign key, less clearly.
  if (errors.length > 0) {
    throw new APIError('Les clés d’API MCP de cet utilisateur n’ont pas pu être supprimées.', 500)
  }
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Utilisateur',
    plural: 'Utilisateurs',
  },
  admin: {
    description: 'Comptes autorisés à se connecter à cet espace d’administration.',
    useAsTitle: 'email',
  },
  auth: true,
  hooks: {
    beforeDelete: [deleteMcpKeys],
  },
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
}
