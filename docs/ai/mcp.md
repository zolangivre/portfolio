# Claude in the CMS (MCP)

**English** · [Français](mcp.fr.md)

The Payload MCP plugin lets an MCP client — Claude Code, Claude Desktop —
read and edit the site's content directly, through `/api/mcp`. It is
configured in `src/payload.config.ts` (`mcpPlugin`).

## What it can reach

| Content                                                                                                       | Operations           |
| ------------------------------------------------------------------------------------------------------------- | -------------------- |
| Projects, journal, experiences, education, testimonials, skills, technologies, categories, companies, schools | find, create, update |
| The eight globals (hero, about, contact, navigation, footer, settings, section texts and visibility)          | find, update         |

No deletion. No contact messages (visitors' personal data), accounts, media or
videos.

**Everything Claude writes is a draft.** In the collections with drafts and in
the globals, an MCP create or update is saved as a draft version
(`src/hooks/mcpWritesAreDrafts.ts`), even if it asks to publish: the live site
doesn't change until you review the draft (Live Preview) and publish it.
Testimonials, skills, technologies, categories, companies and schools have no
drafts: an
MCP edit there is live at once. MCP can't trash anything either: `deletedAt`
is dropped from every MCP write.

Good to know:

- A scheduled publish publishes the document's latest version — a draft
  Claude saved after you scheduled it included. Review before the cron runs.
- Claude reads the published version unless it asks for `draft: true`: tell
  it to, so it builds on pending drafts instead of overwriting them.
- An MCP edit doesn't wait for a document you have open in the admin (the
  tool overrides the lock): on a collection with drafts it only lands in a
  draft.
- Deleting a user deletes their keys.

## Connect Claude Code

1. In the admin (Site → **Clés d'API MCP**), create a key. It acts as your
   user; tick what it may do — nothing is allowed by default.
2. Enable "API key" on it and copy the key.
3. Add the server to Claude Code:

   ```sh
   claude mcp add --transport http payload-portfolio http://localhost:3000/api/mcp \
     --header "Authorization: Bearer <key>"
   ```

   Use the staging or production URL to work on that environment. A key only
   exists in the database it was created in: create one per environment.

Revoke a key by deleting it, or untick "API key" on it.
