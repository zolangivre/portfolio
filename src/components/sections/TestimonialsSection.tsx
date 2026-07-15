import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { SectionCopy } from '@/lib/sectionCopy'
import type { Testimonial } from '@/payload-types'

import { TestimonialCard } from '../cards/TestimonialCard'
import { SectionHeader } from '../ui/SectionHeader'

type TestimonialsSectionProps = {
  content: SectionCopy
  dictionary: Dictionary
  testimonials: Testimonial[]
}

export function TestimonialsSection({
  content,
  dictionary,
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section aria-labelledby="testimonials-title" className="content-section" id="testimonials">
      <Container>
        <SectionHeader
          description={content.description}
          eyebrow={content.eyebrow}
          id="testimonials-title"
          title={content.title}
        />

        {testimonials.length > 0 ? (
          <div className="project-grid">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        ) : (
          <p className="empty-state">{dictionary.testimonials.emptyState}</p>
        )}
      </Container>
    </section>
  )
}
