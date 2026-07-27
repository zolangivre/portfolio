import { Bagel_Fat_One } from 'next/font/google'

// Replaces Payload's default wordmark on the login/forgot-password screens.
// Color can't be set inline (inline styles beat the data-theme override
// below), so it's driven entirely by the .zg-admin-logo CSS rules.
const bagelFatOne = Bagel_Fat_One({
  display: 'swap',
  subsets: ['latin'],
  weight: '400',
})

const css = `
  .zg-admin-logo {
    color: #000;
  }
  :root[data-theme='dark'] .zg-admin-logo {
    color: #fff;
  }
`

export function AdminLogo() {
  return (
    <>
      <style>{css}</style>
      <span
        className={`zg-admin-logo ${bagelFatOne.className}`}
        style={{ display: 'inline-block', fontSize: '80px', letterSpacing: '-0.05em', lineHeight: 1 }}
      >
        Zolan Givre
      </span>
    </>
  )
}
