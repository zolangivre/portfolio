import { cardClassName } from '@/components/ui/Card'
import { ClampedText } from '@/components/ui/ClampedText'
import { FadeImage } from '@/components/ui/FadeImage'
import { getMediaUrl } from '@/lib/media'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Testimonial } from '@/payload-types'

type TestimonialCardProps = {
  dictionary: Dictionary
  testimonial: Testimonial
}

export function TestimonialCard({ dictionary, testimonial }: TestimonialCardProps) {
  const avatarUrl = getMediaUrl(testimonial.avatar)
  const company =
    typeof testimonial.company === 'object' && testimonial.company ? testimonial.company.name : null

  return (
    // Not a link, so no hover glow or lift (those are for the cards you can
    // click — see Card.tsx).
    <div className="h-full">
      <article
        className={cardClassName({
          className: 'flex h-full flex-col justify-between p-7',
          interactive: false,
        })}
      >
        <ClampedText
          className="text-base leading-7 text-fg-muted"
          lessLabel={dictionary.testimonials.readLessLabel}
          moreLabel={dictionary.testimonials.readMoreLabel}
        >
          “{testimonial.quote}”
        </ClampedText>
        <div className="mt-6 flex items-center gap-3">
          {avatarUrl ? (
            <FadeImage
              // The author's name is printed right beside it.
              alt=""
              className="h-10 w-10 rounded-full bg-surface object-contain"
              height={40}
              src={avatarUrl}
              width={40}
            />
          ) : null}
          <div>
            <p className="text-sm font-semibold text-fg">{testimonial.author}</p>
            {testimonial.role || company ? (
              <p className="text-xs text-fg-subtle">
                {testimonial.role}
                {testimonial.role && company ? ' · ' : null}
                {company}
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  )
}
