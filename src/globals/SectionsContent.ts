import type { Field, GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'

const sectionIntroFields = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}): Field[] => [
  {
    name: 'eyebrow',
    type: 'text',
    label: 'Eyebrow',
    localized: true,
    defaultValue: eyebrow,
  },
  {
    name: 'title',
    type: 'text',
    label: 'Title',
    required: true,
    localized: true,
    defaultValue: title,
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Description',
    localized: true,
    defaultValue: description,
  },
]

export const SectionsContent: GlobalConfig = {
  slug: 'sections-content',
  label: 'Sections content',
  admin: {
    group: 'Content',
    description:
      'Eyebrow, title and description text shown above the Projects, Experience, Education, Skills, Testimonials and Journal sections.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
  fields: [
    {
      name: 'projects',
      type: 'group',
      label: 'Projects',
      fields: sectionIntroFields({
        eyebrow: 'Selected work',
        title: 'Projects',
        description:
          'Selected work shaped for fast-moving products, thoughtful UX, and reliable engineering.',
      }),
    },
    {
      name: 'experience',
      type: 'group',
      label: 'Experience',
      fields: sectionIntroFields({
        eyebrow: 'Background',
        title: 'Experience',
        description:
          'A track record of building product experiences with strong technical ownership.',
      }),
    },
    {
      name: 'education',
      type: 'group',
      label: 'Education',
      fields: sectionIntroFields({
        eyebrow: 'Education',
        title: 'Education',
        description: 'Academic background and continuing learning paths managed from Payload CMS.',
      }),
    },
    {
      name: 'skills',
      type: 'group',
      label: 'Skills',
      fields: sectionIntroFields({
        eyebrow: 'Capabilities',
        title: 'Skills',
        description:
          'A toolkit refined for modern product development across frontend, backend, and delivery.',
      }),
    },
    {
      name: 'testimonials',
      type: 'group',
      label: 'Testimonials',
      fields: sectionIntroFields({
        eyebrow: 'Testimonials',
        title: 'What people say',
        description: "Feedback from people I've worked with on shipped products.",
      }),
    },
    {
      name: 'journal',
      type: 'group',
      label: 'Journal',
      fields: sectionIntroFields({
        eyebrow: 'Beyond code',
        title: 'Journal',
        description: 'Travel, sport, achievements, and milestones — another side of the journey.',
      }),
    },
  ],
}
