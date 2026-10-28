import { AboutSection } from '@/components/sections/AboutSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { EducationSection } from '@/components/sections/EducationSection'
import { ExperienceSection } from '@/components/sections/ExperienceSection'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProjectsSection } from '@/components/sections/ProjectsSection'
import { SkillsSection } from '@/components/sections/SkillsSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { Reveal } from '@/components/ui/Reveal'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { resolveSectionCopy } from '@/lib/sectionCopy'
import type {
  About,
  Contact,
  Education,
  Experience,
  Hero,
  Project,
  SectionsContent,
  SectionsVisibility,
  Setting,
  Skill,
  Testimonial,
} from '@/payload-types'

export type HomeData = {
  about: About | null
  contact: Contact | null
  education: Education[]
  experiences: Experience[]
  hero: Hero | null
  projects: Project[]
  sections: SectionsVisibility | null
  sectionsContent: SectionsContent | null
  settings: Setting | null
  skills: Skill[]
  testimonials: Testimonial[]
}

type HomeSectionsProps = {
  data: HomeData
  dictionary: Dictionary
  locale: Locale
}

/**
 * The homepage's sections, in order. Shared by the page and the dev-only
 * worst-case route (dev/break-ui), so both render exactly the same markup
 * from whatever data they're handed.
 */
export function HomeSections({ data, dictionary, locale }: HomeSectionsProps) {
  const {
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
  } = data

  return (
    <>
      {sections?.hero !== false ? (
        <Reveal>
          <HeroSection
            fallbackTitle={dictionary.hero.fallbackTitle}
            hero={hero}
            settings={settings}
          />
        </Reveal>
      ) : null}
      {sections?.projects !== false ? (
        <Reveal>
          <ProjectsSection
            content={resolveSectionCopy(sectionsContent?.projects, dictionary.projects)}
            dictionary={dictionary}
            locale={locale}
            projects={projects}
          />
        </Reveal>
      ) : null}
      {sections?.experience !== false ? (
        <Reveal>
          <ExperienceSection
            content={resolveSectionCopy(sectionsContent?.experience, dictionary.experience)}
            dictionary={dictionary}
            experiences={experiences}
            locale={locale}
          />
        </Reveal>
      ) : null}
      {sections?.education !== false ? (
        <Reveal>
          <EducationSection
            content={resolveSectionCopy(sectionsContent?.education, dictionary.education)}
            dictionary={dictionary}
            education={education}
            locale={locale}
          />
        </Reveal>
      ) : null}
      {sections?.skills !== false ? (
        <Reveal>
          <SkillsSection
            content={resolveSectionCopy(sectionsContent?.skills, dictionary.skills)}
            dictionary={dictionary}
            skills={skills}
          />
        </Reveal>
      ) : null}
      {sections?.about !== false ? (
        <Reveal>
          <AboutSection about={about} dictionary={dictionary} />
        </Reveal>
      ) : null}
      {sections?.testimonials !== false ? (
        <Reveal>
          <TestimonialsSection
            content={resolveSectionCopy(sectionsContent?.testimonials, dictionary.testimonials)}
            dictionary={dictionary}
            testimonials={testimonials}
          />
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
