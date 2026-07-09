import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'

const sectionField = (name: string, label: string) => ({
  name,
  type: 'checkbox' as const,
  label,
  defaultValue: true,
  admin: {
    description: `Show or hide the ${label} section across the site.`,
  },
})

export const SectionsVisibility: GlobalConfig = {
  slug: 'sections-visibility',
  label: 'Sections visibility',
  admin: {
    group: 'Site',
    description:
      'Toggle which sections of the site are shown. Disabled sections are hidden from the homepage, the navigation, and (for Journal) its dedicated pages.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
  fields: [
    sectionField('hero', 'Hero'),
    sectionField('about', 'About'),
    sectionField('projects', 'Projects'),
    sectionField('experience', 'Experience'),
    sectionField('education', 'Education'),
    sectionField('skills', 'Skills'),
    sectionField('testimonials', 'Testimonials'),
    sectionField('contact', 'Contact'),
    sectionField('journal', 'Journal'),
  ],
}
