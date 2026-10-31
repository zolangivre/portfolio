import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import { loadImageForOg, OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { getGlobalSettings, getProject } from '@/lib/queries'

// Rendered on first request, then cached: a card built while the media host
// was down (text-only fallback) is rebuilt within a day, like the pages.
export const revalidate = 86400

type Params = { locale: string; slug: string }

function resolveLocale(locale: string): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale
}

/**
 * One card per project, described by its own title. `generateImageMetadata`
 * is what lets the alt text follow the page (and its language): a plain
 * `export const alt` is a single string for every project. Next then builds
 * this route's static params itself, so the card renders on first request.
 */
export async function generateImageMetadata({ params }: { params: Params }) {
  const locale = resolveLocale(params.locale)
  const project = await getProject(params.slug, locale)

  return [
    {
      alt: project?.meta?.title || project?.title || getDictionary(locale).projects.title,
      contentType: OG_CONTENT_TYPE,
      id: 'card',
      size: OG_SIZE,
    },
  ]
}

export default async function OpengraphImage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const dictionary = getDictionary(locale)

  const [settings, project] = await Promise.all([getGlobalSettings(locale), getProject(slug, locale)])

  const category =
    project && typeof project.category === 'object' && project.category
      ? project.category.name
      : null
  const technologies = (project?.technologies ?? [])
    .map((technology) => (typeof technology === 'object' && technology ? technology.name : null))
    .filter((name): name is string => Boolean(name))
    .slice(0, 3)

  // A photo picked in the SEO tab fills the card; otherwise the logo (the
  // cover, made for the light page) sits on its light tile.
  const [photo, logo] = await Promise.all([
    loadImageForOg(getMediaUrl(project?.meta?.image), OG_SIZE.width),
    loadImageForOg(getMediaUrl(project?.coverImage), 520),
  ])

  return renderOgImage({
    accentKey: settings?.theme?.primaryColor,
    eyebrow: category ?? dictionary.projects.title,
    logo,
    meta: [project?.year ? String(project.year) : null, ...technologies],
    name: settings?.name,
    photo,
    profession: settings?.profession,
    title: project?.title ?? dictionary.projects.title,
  })
}
