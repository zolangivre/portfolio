/**
 * The contact form's rules, shared by the server action (the authority) and
 * the form itself, which checks each field as the visitor leaves it so a
 * mistake shows up right there instead of after a round trip.
 */

export type ContactField = 'name' | 'email' | 'message'

/** Which `dictionary.contact.fieldErrors` message applies, if any. */
export type ContactFieldProblem = 'name' | 'email' | 'emailFormat' | 'message'

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function contactFieldProblem(
  field: ContactField,
  rawValue: string,
): ContactFieldProblem | null {
  const value = rawValue.trim()

  if (!value) {
    return field
  }

  if (field === 'email' && !EMAIL_PATTERN.test(value)) {
    return 'emailFormat'
  }

  return null
}
