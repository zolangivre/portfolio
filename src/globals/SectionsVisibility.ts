import type { CheckboxField, GlobalConfig } from 'payload'

import { draftVersions, GLOBAL_SCHEDULE_HINT, hideUnpublishButton } from '@/collections/drafts'
import { mcpGlobalWritesAreDrafts } from '@/hooks/mcpWritesAreDrafts'
import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'
import { readPublishedOrAuthenticated } from '@/lib/access'
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
      'Choisissez les sections affichées sur le site. Une section désactivée disparaît de la page d’accueil, de la navigation et, pour le journal, de ses pages dédiées.' +
      GLOBAL_SCHEDULE_HINT,
    components: hideUnpublishButton(),
  },
  versions: draftVersions(),
  access: {
    read: readPublishedOrAuthenticated,
  },
  hooks: {
    beforeOperation: [mcpGlobalWritesAreDrafts],
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
