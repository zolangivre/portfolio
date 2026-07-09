import { AboutSection } from '@/components/sections/AboutSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { EducationSection } from '@/components/sections/EducationSection'
import { ExperienceSection } from '@/components/sections/ExperienceSection'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProjectsSection } from '@/components/sections/ProjectsSection'
import { SkillsSection } from '@/components/sections/SkillsSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { Reveal } from '@/components/ui/Reveal'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import {
  getAbout,
  getContact,
  getEducation,
  getExperiences,
  getFeaturedProjects,
  getGlobalSettings,
  getHero,
  getSectionsVisibility,
  getSkills,
  getTestimonials,
} from '@/lib/queries'

import './styles.css'

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
    getFeaturedProjects(locale),
    getExperiences(locale),
    getSkills(locale),
    getEducation(locale),
    getTestimonials(locale),
  ])

  return (
    <>
      {sections?.hero !== false ? (
        <Reveal>
          <HeroSection hero={hero} settings={settings} />
        </Reveal>
      ) : null}
      {sections?.projects !== false ? (
        <Reveal>
          <ProjectsSection dictionary={dictionary} locale={locale} projects={projects} />
        </Reveal>
      ) : null}
      {sections?.experience !== false ? (
        <Reveal>
          <ExperienceSection dictionary={dictionary} experiences={experiences} locale={locale} />
        </Reveal>
      ) : null}
      {sections?.education !== false ? (
        <Reveal>
          <EducationSection dictionary={dictionary} education={education} locale={locale} />
        </Reveal>
      ) : null}
      {sections?.skills !== false ? (
        <Reveal>
          <SkillsSection dictionary={dictionary} skills={skills} />
        </Reveal>
      ) : null}
      {sections?.about !== false ? (
        <Reveal>
          <AboutSection about={about} dictionary={dictionary} />
        </Reveal>
      ) : null}
      {sections?.testimonials !== false ? (
        <Reveal>
          <TestimonialsSection dictionary={dictionary} testimonials={testimonials} />
        </Reveal>
      ) : null}
      {sections?.contact !== false ? (
        <Reveal>
          <ContactSection contact={contact} dictionary={dictionary} settings={settings} />
        </Reveal>
      ) : null}
    </>
  )
}
