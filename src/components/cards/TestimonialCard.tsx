import Image from 'next/image'

import { getMediaUrl } from '@/lib/media'
import type { Testimonial } from '@/payload-types'

type TestimonialCardProps = {
  testimonial: Testimonial
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const avatarUrl = getMediaUrl(testimonial.avatar)
  const company =
    typeof testimonial.company === 'object' && testimonial.company ? testimonial.company.name : null

  return (
    <article className="flex h-full flex-col justify-between rounded-[28px] border border-border bg-bg-elevated p-7 shadow-lg shadow-black/5">
      <p className="text-base leading-7 text-fg-muted">“{testimonial.quote}”</p>
      <div className="mt-6 flex items-center gap-3">
        {avatarUrl ? (
          <Image
            alt={testimonial.author}
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
  )
}
