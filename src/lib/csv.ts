/** What a spreadsheet reads as the start of a formula, full-width forms included. */
const FORMULA_START = /^[=+\-@\t\r＝＋－＠]/

/**
 * Keeps text from running as a formula when an exported CSV is opened in a
 * spreadsheet: a leading quote makes it plain text. Only for what visitors
 * write, since editors already hold every right a formula could be after.
 */
export const neutralizeFormula = (value: unknown) =>
  typeof value === 'string' && FORMULA_START.test(value) ? `'${value}` : value
