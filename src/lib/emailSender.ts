/**
 * The sender in `CONTACT_NOTIFICATION_FROM`, split for Payload's email
 * adapter, which takes the address and the display name apart. Accepts
 * `Name <address>` or a bare address; `null` when neither is there.
 */
export function parseSender(
  value: string | undefined,
  fallbackName = 'Portfolio',
): { address: string; name: string } | null {
  const trimmed = value?.trim().replace(/^"|"$/g, '')
  if (!trimmed) return null

  const named = /^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/.exec(trimmed)
  if (named) {
    return { address: named[2]!, name: named[1]!.replace(/^"|"$/g, '').trim() || fallbackName }
  }

  return /^[^<>\s]+@[^<>\s]+$/.test(trimmed) ? { address: trimmed, name: fallbackName } : null
}
