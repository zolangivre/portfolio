import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Testimonial } from '@/payload-types'

import { TestimonialCard } from '../cards/TestimonialCard'
import { SectionHeader } from '../ui/SectionHeader'

type TestimonialsSectionProps = {
  dictionary: Dictionary
  testimonials: Testimonial[]
}

export function TestimonialsSection({ dictionary, testimonials }: TestimonialsSectionProps) {
  return (
    <section aria-labelledby="testimonials-title" className="content-section" id="testimonials">
      <Container>
        <SectionHeader
          description={dictionary.testimonials.description}
          eyebrow={dictionary.testimonials.eyebrow}
          id="testimonials-title"
          title={dictionary.testimonials.title}
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
