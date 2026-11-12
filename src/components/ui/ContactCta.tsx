import Link from 'next/link'

import { buttonClassName } from '@/components/ui/Button'
import { cardClassName } from '@/components/ui/Card'

type ContactCtaProps = {
  buttonLabel: string
  eyebrow: string
  /** The homepage's contact section, in the page's locale. */
  href: string
  text: string
  title: string
}

/**
 * The invitation to get in touch that closes a project or a journal entry.
 * Without it a visitor who has just read a whole page had only "previous"
 * and "next" to go on; this is the one step toward the contact form, set
 * apart in the accent tint. Static: a panel holding a button, not a card
 * you click.
 */
export function ContactCta({ buttonLabel, eyebrow, href, text, title }: ContactCtaProps) {
  return (
    <aside
      aria-labelledby="contact-cta-title"
      className={cardClassName({
        className:
          'flex flex-col items-start gap-6 p-7 sm:p-9 md:flex-row md:items-center md:justify-between',
        interactive: false,
        tone: 'accent',
      })}
    >
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mb-2 text-2xl sm:text-3xl" id="contact-cta-title">
          {title}
        </h2>
        <p className="mb-0 max-w-xl text-fg-muted">{text}</p>
      </div>
      <Link className={buttonClassName('primary', 'shrink-0')} href={href}>
        {buttonLabel}
      </Link>
    </aside>
  )
}
