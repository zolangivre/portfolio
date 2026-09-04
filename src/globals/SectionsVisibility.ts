import type { CheckboxField, GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'
import { adminGroups, sectionLabels } from '@/lib/adminLabels'

const sectionField = (name: keyof typeof sectionLabels): CheckboxField => ({
  name,
  type: 'checkbox',
  label: sectionLabels[name],
  defaultValue: true,
  admin: {
    description: `Affiche ou masque la section ${sectionLabels[name]} sur tout le site.`,
  },
})

export const SectionsVisibility: GlobalConfig = {
  slug: 'sections-visibility',
  label: 'Visibilité des sections',
  admin: {
    group: adminGroups.site,
    description:
      'Choisissez les sections affichées sur le site. Une section désactivée disparaît de la page d’accueil, de la navigation et, pour le journal, de ses pages dédiées.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
  fields: [
    sectionField('hero'),
    sectionField('about'),
    sectionField('projects'),
    sectionField('experience'),
    sectionField('education'),
    sectionField('skills'),
    sectionField('testimonials'),
    sectionField('contact'),
    sectionField('journal'),
  ],
}
