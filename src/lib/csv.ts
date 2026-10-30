const TRIGGER = '[=+\\-@＝＋－＠]'

/** The start of the text: a formula, even behind spaces, or a tab or a return. */
const FORMULA_AT_START = new RegExp(`^(\\s*${TRIGGER}|[\\t\\r])`)

/**
 * A formula further in. The file is comma-separated, but a French Excel splits
 * it on semicolons, and then on line breaks too, since a quoted cell no longer
 * reads as one: each of these can open as a cell of its own.
 */
const FORMULA_INSIDE = new RegExp(`([;\\t\\r\\n] *)(?=${TRIGGER})`, 'g')

/**
 * Keeps text from running as a formula when an exported CSV is opened in a
 * spreadsheet: a leading quote makes a cell plain text. Only for what visitors
 * write, since editors already hold every right a formula could be after.
 */
export const neutralizeFormula = (value: unknown) => {
  if (typeof value !== 'string') return value

  const inside = value.replace(FORMULA_INSIDE, `$1'`)

  return FORMULA_AT_START.test(value) ? `'${inside}` : inside
}
