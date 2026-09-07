import type { Field, GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'
import { adminGroups, sectionLabels } from '@/lib/adminLabels'
import { textToLexicalParagraphs } from '@/lib/richText'

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
    label: 'Surtitre',
    localized: true,
    defaultValue: eyebrow,
  },
  {
    name: 'title',
    type: 'text',
    label: 'Titre',
    required: true,
    localized: true,
    defaultValue: title,
  },
  {
    name: 'description',
    type: 'richText',
    label: 'Description',
    localized: true,
    defaultValue: textToLexicalParagraphs(description),
  },
]

export const SectionsContent: GlobalConfig = {
  slug: 'sections-content',
  label: 'Contenu des sections',
  admin: {
    group: adminGroups.content,
    description:
      'Surtitre, titre et description affichés au-dessus des sections Projets, Expériences, Formations, Compétences, Témoignages et Journal.',
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
      label: sectionLabels.projects,
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
      label: sectionLabels.experience,
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
      label: sectionLabels.education,
      fields: sectionIntroFields({
        eyebrow: 'Education',
        title: 'Education',
        description: 'Academic background and continuing learning paths managed from Payload CMS.',
      }),
    },
    {
      name: 'skills',
      type: 'group',
      label: sectionLabels.skills,
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
      label: sectionLabels.testimonials,
      fields: sectionIntroFields({
        eyebrow: 'Testimonials',
        title: 'What people say',
        description: "Feedback from people I've worked with on shipped products.",
      }),
    },
    {
      name: 'journal',
      type: 'group',
      label: sectionLabels.journal,
      fields: sectionIntroFields({
        eyebrow: 'Beyond code',
        title: 'Journal',
        description: 'Travel, sport, achievements, and milestones — another side of the journey.',
      }),
    },
  ],
}
