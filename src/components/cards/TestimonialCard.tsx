import { FadeImage } from '@/components/ui/FadeImage'
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
    <article
      className="flex h-full flex-col justify-between rounded-[28px] border border-border bg-bg-elevated p-7 shadow-lg shadow-black/5 transition duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 hover:border-accent-soft-border hover:shadow-[0_25px_60px_-15px_var(--accent-soft-border)]"
      data-cursor="pointer"
    >
      <p className="text-base leading-7 text-fg-muted">“{testimonial.quote}”</p>
      <div className="mt-6 flex items-center gap-3">
        {avatarUrl ? (
          <FadeImage
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
