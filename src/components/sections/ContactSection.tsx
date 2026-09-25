import Image from 'next/image'

import { cardClassName } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { getMediaUrl } from '@/lib/media'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Contact, Setting } from '@/payload-types'

import { ContactForm } from './ContactForm'
import { BuiltInSocialIcon } from '../ui/SocialIcons'
import { Reveal } from '../ui/Reveal'
import { SectionHeader } from '../ui/SectionHeader'

type ContactSectionProps = {
  contact: Contact | null
  dictionary: Dictionary
  settings: Setting | null
}

export function ContactSection({ contact, dictionary, settings }: ContactSectionProps) {
  const title = contact?.title ?? 'Let’s build something meaningful.'
  const email = settings?.contactEmail ?? 'hello@yourdomain.com'
  const socialLinks = settings?.socialLinks ?? []
  const successMessage =
    contact?.successMessage ?? 'Thanks for reaching out — I’ll get back to you shortly.'

  return (
    <section aria-labelledby="contact-title" className="content-section" id="contact">
      <Container>
        <SectionHeader
          description={contact?.description ?? undefined}
          eyebrow={contact?.eyebrow || dictionary.contact.eyebrow}
          id="contact-title"
          title={title}
        />

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className={cardClassName({ className: 'p-8', interactive: false })}>
            <p className="eyebrow mb-0">
              {dictionary.contact.reachOut}
            </p>
            <a
              className="mt-4 inline-flex text-xl font-semibold text-fg transition hover:text-accent"
              href={`mailto:${email}`}
            >
              {email}
            </a>
            {socialLinks.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-fg-muted">
                {socialLinks.map((link) => {
                  const iconUrl = getMediaUrl(link.icon)

                  return (
                    <a
                      className="group inline-flex items-center gap-2 capitalize transition hover:text-accent"
                      href={link.url}
                      key={link.id ?? link.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="inline-flex transition group-hover:-translate-y-0.5 group-hover:scale-110">
                        {iconUrl ? (
                          <Image
                            alt=""
                            className="h-4 w-4 object-contain"
                            height={16}
                            src={iconUrl}
                            width={16}
                          />
                        ) : (
                          <BuiltInSocialIcon platform={link.platform} />
                        )}
                      </span>
                      {link.platform}
                    </a>
                  )
                })}
              </div>
            ) : null}
          </Reveal>

          <Reveal
            className={cardClassName({ className: 'p-8', interactive: false })}
            delay={0.1}
          >
            <ContactForm dictionary={dictionary} successMessage={successMessage} />
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
