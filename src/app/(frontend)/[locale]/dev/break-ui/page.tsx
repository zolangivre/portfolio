import Link from 'next/link'
import { notFound } from 'next/navigation'

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

import { HomeSections, type HomeData } from '../../HomeSections'
import { empty, maxed, one, worstCase } from './fixtures'
import '../../styles.css'

/**
 * Dev-only stress test of the homepage: the same sections, fed either the
 * real CMS content or one of the worst-case fixtures, picked with
 * `?data=demo|worst|empty|one|max`. 404s in production.
 */
const STATES = [
  { key: 'demo', label: 'Demo data' },
  { key: 'worst', label: 'Worst case' },
  { key: 'empty', label: 'Empty' },
  { key: 'one', label: 'One' },
  { key: 'max', label: 'Max (caps)' },
] as const

type StateKey = (typeof STATES)[number]['key']

const FIXTURES: Record<Exclude<StateKey, 'demo'>, HomeData> = {
  empty,
  max: maxed,
  one,
  worst: worstCase,
}

async function loadDemo(locale: Locale): Promise<HomeData> {
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

  return {
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
  }
}

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ data?: string }>
}

export default async function BreakUiPage({ params, searchParams }: PageProps) {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  const [{ locale: rawLocale }, { data: rawState }] = await Promise.all([params, searchParams])
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : defaultLocale
  const state: StateKey = STATES.some(({ key }) => key === rawState)
    ? (rawState as StateKey)
    : 'worst'
  const data = state === 'demo' ? await loadDemo(locale) : FIXTURES[state]

  return (
    <>
      <HomeSections data={data} dictionary={getDictionary(locale)} locale={locale} />
      {/* Chrome, not design: plain on purpose, out of the page's way. */}
      <nav
        aria-label="Dataset"
        style={{
          background: '#e5e5e5',
          borderRadius: 999,
          bottom: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,.18)',
          display: 'flex',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          gap: 2,
          left: '50%',
          maxWidth: 'calc(100vw - 16px)',
          overflowX: 'auto',
          padding: 3,
          position: 'fixed',
          transform: 'translateX(-50%)',
          zIndex: 2147483647,
        }}
      >
        {STATES.map(({ key, label }) => (
          <Link
            aria-current={key === state ? 'page' : undefined}
            href={`?data=${key}`}
            key={key}
            replace
            scroll={false}
            style={{
              background: key === state ? '#fff' : 'transparent',
              borderRadius: 999,
              color: '#111',
              fontWeight: key === state ? 600 : 400,
              padding: '6px 12px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
