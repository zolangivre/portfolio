import { cardClassName } from '@/components/ui/Card'
import { CopyButton } from '@/components/ui/CopyButton'
import { Container } from '@/components/ui/Container'
import { SafeImage } from '@/components/ui/SafeImage'
import { getMediaUrl } from '@/lib/media'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Contact, Setting } from '@/payload-types'

import { ContactForm } from './ContactForm'
import { BuiltInSocialIcon, socialLinkLabel } from '../ui/SocialIcons'
import { Reveal } from '../ui/Reveal'
import { SectionHeader } from '../ui/SectionHeader'

type ContactSectionProps = {
  contact: Contact | null
  dictionary: Dictionary
  settings: Setting | null
}

export function ContactSection({ contact, dictionary, settings }: ContactSectionProps) {
  const title = contact?.title || dictionary.contact.fallbackTitle
  const email = settings?.contactEmail
  const socialLinks = settings?.socialLinks ?? []
  const successMessage = contact?.successMessage || dictionary.contact.fallbackSuccessMessage

  return (
    <section aria-labelledby="contact-title" className="content-section" id="contact">
      <Container>
        <SectionHeader
          description={contact?.description ?? undefined}
          eyebrow={contact?.eyebrow || dictionary.contact.eyebrow}
          id="contact-title"
          title={title}
        />

        {/* minmax(0, …): a track never widens to fit a long unbroken email. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Reveal className={cardClassName({ className: 'p-8', interactive: false })}>
            <p className="eyebrow mb-0">{dictionary.contact.reachOut}</p>
            {email ? (
              // The address wraps within its own box (anywhere, since it has
              // no spaces) so the copy button stays beside it.
              <div className="mt-4 flex items-center gap-x-1">
                <a
                  className="min-w-0 text-xl font-semibold text-fg wrap-anywhere transition hover:text-accent"
                  href={`mailto:${email}`}
                >
                  {email}
                </a>
                <CopyButton
                  ariaLabel={dictionary.contact.copyEmailAriaLabel}
                  copiedLabel={dictionary.contact.copiedLabel}
                  failedLabel={dictionary.contact.copyFailedLabel}
                  value={email}
                />
              </div>
            ) : null}
            {socialLinks.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-fg-muted">
                {socialLinks.map((link) => {
                  const iconUrl = getMediaUrl(link.icon)

                  return (
                    <a
                      className="group inline-flex items-center gap-2 transition hover:text-accent"
                      href={link.url}
                      key={link.id ?? link.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="inline-flex transition group-hover:-translate-y-0.5 group-hover:scale-110">
                        {iconUrl ? (
                          <SafeImage
                            alt=""
                            className="h-4 w-4 object-contain"
                            fallback={<BuiltInSocialIcon platform={link.platform} />}
                            height={16}
                            src={iconUrl}
                            width={16}
                          />
                        ) : (
                          <BuiltInSocialIcon platform={link.platform} />
                        )}
                      </span>
                      {socialLinkLabel(link.platform, link.url)}
                    </a>
                  )
                })}
              </div>
            ) : null}
          </Reveal>

          <Reveal className={cardClassName({ className: 'p-8', interactive: false })} delay={0.1}>
            <ContactForm dictionary={dictionary} successMessage={successMessage} />
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
