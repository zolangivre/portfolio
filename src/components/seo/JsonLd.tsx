/**
 * Structured data, rendered into the server HTML. `next/script` used to carry
 * it, but its default strategy injects the tag after hydration, so crawlers
 * that read the served HTML never saw it.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      // JSON.stringify leaves `<` intact, so a CMS value containing
      // `</script>` would close this tag early and let whatever follows run
      // as markup. Escaping it keeps the payload valid JSON.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
      type="application/ld+json"
    />
  )
}
