import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import {
  getAbout,
  getAllProjects,
  getContact,
  getEducation,
  getExperiences,
  getGlobalSettings,
  getHero,
  getSectionsContent,
  getSectionsVisibility,
  getSkills,
  getTestimonials,
} from '@/lib/queries'

import { HomeSections } from './HomeSections'
import './styles.css'
import { ReadingProgress } from '@/components/ui/ReadingProgress'

// Safety net only — see the note in the locale layout. Freshness comes from
// the tag-based revalidation in Payload's afterChange hooks.
export const revalidate = 86400

type PageParams = { locale: string }

export default async function HomePage({ params }: { params: Promise<PageParams> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : defaultLocale
  const dictionary = getDictionary(locale)

  const [
    hero,
    about,
    contact,
    settings,
    sections,
    sectionsContent,
    projects,
    experiences,
    skills,
    education,
    testimonials,
  ] = await Promise.all([
    getHero(locale),
    getAbout(locale),
    getContact(locale),
    getGlobalSettings(locale),
    getSectionsVisibility(locale),
    getSectionsContent(locale),
    getAllProjects(locale),
    getExperiences(locale),
    getSkills(locale),
    getEducation(locale),
    getTestimonials(locale),
  ])

  return (
    <>
      <ReadingProgress />
      <HomeSections
        data={{
          about,
          contact,
          education,
          experiences,
          hero,
          projects,
          sections,
          sectionsContent,
          settings,
          skills,
          testimonials,
        }}
        dictionary={dictionary}
        locale={locale}
      />
    </>
  )
}
