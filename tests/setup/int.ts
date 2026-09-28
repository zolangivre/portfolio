import { assertTestDatabase, loadTestEnv } from '../helpers/testDatabase'

// Runs in every integration test worker before the test file is imported —
// payload.config.ts reads DATABASE_URL at import time, so the env has to be in
// place first. The global setup already checked it; this covers workers too.
loadTestEnv()
assertTestDatabase()

// Tests create messages; with a key exported in the shell, notifyNewMessage
// would email each one for real.
delete process.env.RESEND_API_KEY
