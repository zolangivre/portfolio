/**
 * Where a spreadsheet can start a cell, then what can stand between that and a
 * formula. The file is comma-separated, but a French Excel splits it on
 * semicolons, and then on line breaks too, since a quoted cell no longer reads
 * as one. Padding and formula are matched in one go, not with a lookahead: a
 * visitor's run of tabs would otherwise be scanned again from each tab.
 */
const CELL_START = /(^|[;\t\r\n])([\s";]*)([=+\-@＝＋－＠])?/g

/**
 * Keeps text from running as a formula when an exported CSV is opened in a
 * spreadsheet: a quote in front of it makes it plain text. A leading tab or
 * return counts as a formula on its own. Only for what visitors write, since
 * editors already hold every right a formula could be after.
 */
export const neutralizeFormula = (value: unknown) => {
  if (typeof value !== 'string') return value

  const text = value.replace(
    CELL_START,
    (match: string, start: string, padding: string, formula?: string) =>
      formula ? `${start}${padding}'${formula}` : match,
  )

  return /^[\t\r]/.test(value) ? `'${text}` : text
}
