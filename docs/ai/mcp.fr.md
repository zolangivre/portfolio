# Claude dans le CMS (MCP)

[English](mcp.md) · **Français**

Le plugin MCP de Payload permet à un client MCP — Claude Code, Claude
Desktop — de lire et de modifier directement le contenu du site, via
`/api/mcp`. Il est configuré dans `src/payload.config.ts` (`mcpPlugin`).

## Ce qu'il peut atteindre

| Contenu                                                                                                            | Opérations            |
| ------------------------------------------------------------------------------------------------------------------ | --------------------- |
| Projets, journal, expériences, formations, témoignages, compétences, technologies, catégories, entreprises, écoles | lire, créer, modifier |
| Les huit globals (hero, à propos, contact, navigation, pied de page, réglages, textes et visibilité des sections)  | lire, modifier        |

Pas de suppression. Ni les messages de contact (données personnelles des
visiteurs), ni les comptes, ni les médias, ni les vidéos.

**Tout ce que Claude écrit est un brouillon.** Dans les collections à
brouillons et les globals, une création ou une modification MCP est
enregistrée comme version brouillon (`src/hooks/mcpWritesAreDrafts.ts`), même
si elle demande à publier : le site ne change pas tant que tu n'as pas relu
le brouillon (aperçu en direct) et publié. Témoignages, compétences,
technologies, catégories, entreprises et écoles n'ont pas de brouillons : une modification
MCP y est en ligne aussitôt. MCP ne peut rien mettre à la corbeille non plus :
`deletedAt` est retiré de toute écriture MCP.

Bon à savoir :

- Une publication programmée publie la dernière version du document — y
  compris un brouillon enregistré par Claude après la programmation. Relis
  avant le passage du cron.
- Claude lit la version publiée sauf s'il demande `draft: true` : dis-le-lui,
  pour qu'il parte des brouillons en attente au lieu de les écraser.
- Une modification MCP n'attend pas un document que tu as ouvert dans
  l'admin (l'outil passe outre le verrou) : sur une collection à brouillons,
  elle n'atterrit que dans un brouillon.
- Supprimer un utilisateur supprime ses clés.

## Brancher Claude Code

1. Dans l'admin (Site → **Clés d'API MCP**), crée une clé. Elle agit en ton
   nom ; coche ce qu'elle peut faire — rien n'est permis par défaut.
2. Active « API key » dessus et copie la clé.
3. Ajoute le serveur à Claude Code :

   ```sh
   claude mcp add --transport http payload-portfolio http://localhost:3000/api/mcp \
     --header "Authorization: Bearer <clé>"
   ```

   Prends l'URL de staging ou de production pour travailler sur cet
   environnement. Une clé n'existe que dans la base où elle a été créée : il
   en faut une par environnement.

Pour révoquer une clé, supprime-la ou décoche « API key ».
