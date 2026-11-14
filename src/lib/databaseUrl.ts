/**
 * Spells out the TLS mode pg already applies to the production database.
 *
 * Neon's connection string says `sslmode=require`. pg 8 treats `prefer`,
 * `require` and `verify-ca` as `verify-full` (the server certificate is
 * checked), but warns about it on every cold start: Node prints the warning
 * with `console.error`, captureConsoleIntegration sends it to Sentry, and it
 * was nearly all of the organisation's error quota (PORTFOLIO-4). pg 9 will
 * give these modes their libpq meaning, where `require` no longer checks the
 * certificate. Writing `verify-full` keeps today's behaviour, silences the
 * warning, and keeps the check after that upgrade.
 *
 * Any other mode (`disable` for the local database, `verify-full`, none) is
 * left alone.
 */
export function withVerifiedTls(connectionString: string): string {
  return connectionString.replace(
    /([?&]sslmode=)(?:prefer|require|verify-ca)(?=&|$)/,
    '$1verify-full',
  )
}
