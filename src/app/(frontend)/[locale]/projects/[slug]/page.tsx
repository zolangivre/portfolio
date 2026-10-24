import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'

import { AdjacentNav } from '@/components/ui/AdjacentNav'
import { AnimatedTitle } from '@/components/ui/AnimatedTitle'
import { TechChip } from '@/components/ui/TechChip'
import { Container } from '@/components/ui/Container'
import { DeviceMockup } from '@/components/ui/DeviceMockup'
import { Divider } from '@/components/ui/Divider'
import Image from 'next/image'
import { MediaGallery } from '@/components/ui/MediaGallery'
import { ProjectLogo } from '@/components/ui/ProjectLogo'
import { Reveal } from '@/components/ui/Reveal'
import { RichText } from '@/components/ui/RichText'
import { getAdjacentBySlug } from '@/lib/adjacent'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { asMediaDoc, getMediaUrl, getRelationUrl } from '@/lib/media'
import { getAllProjects, getProject, getSectionsVisibility } from '@/lib/queries'
import { ReadingProgress } from '@/components/ui/ReadingProgress'

// Safety net only — see the note in the locale layout. Freshness comes from
// the tag-based revalidation in Payload's afterChange hooks.
export const revalidate = 86400

type PageParams = { locale: string; slug: string }

function resolveLocale(locale: string): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale
}

export async function generateStaticParams() {
  const params: PageParams[] = []

  for (const locale of locales) {
    const projects = await getAllProjects(locale)
    for (const project of projects) {
      params.push({ locale, slug: project.slug })
    }
  }

  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const project = await getProject(slug, locale)

  if (!project) {
    return {}
  }

  // Only an image picked in the SEO tab overrides the generated card from
  // `opengraph-image.tsx`. The cover image used to be the fallback here, but
  // covers are framed for the page (often a logo on empty space) and made a
  // poor 1200x630 preview — the generated card is the better default.
  const imageUrl = getMediaUrl(project.meta?.image)

  return {
    title: project.meta?.title || project.title,
    description: project.meta?.description || project.shortDescription,
    openGraph: imageUrl ? { images: [{ url: imageUrl }] } : undefined,
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<PageParams> }) {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const dictionary = getDictionary(locale)
  const sections = await getSectionsVisibility(locale)

  if (sections?.projects === false) {
    notFound()
  }

  const project = await getProject(slug, locale)

  if (!project) {
    notFound()
  }

  const imageUrl = getMediaUrl(project.coverImage)
  const darkImageUrl = getMediaUrl(project.coverImageDark)
  const imageAlt =
    typeof project.coverImage === 'object' && project.coverImage
      ? project.coverImage.alt
      : project.title
  // The opener prefers a screenshot framed in the device the project was built
  // for — the same device its card shows, so the two morph into each other.
  // The cover (usually a logo) then sits next to the title; without a mockup
  // it stays the opener, as on the card.
  const mockupFrame =
    project.mockupFrame && project.mockupFrame !== 'none' ? project.mockupFrame : null
  // Only whether there is anything to frame — DeviceMockup resolves which of
  // the two uploads to show, and everything that follows from that.
  const mockupUrl = getRelationUrl(project.mockupImage) ?? getRelationUrl(project.mockupImageDark)
  const categoryLabel =
    typeof project.category === 'object' && project.category ? project.category.name : null
  const statusLabel = project.status
    ? (dictionary.projects.statusLabels[project.status] ?? project.status)
    : null
  const technologies = project.technologies ?? []
  // Both collections can be dropped in the same gallery, and their ids are
  // independent sequences — so the key has to carry the collection too, or a
  // media and a video that happen to share an id collide in the React list.
  const gallery = (project.gallery ?? []).flatMap((item) => {
    const doc = asMediaDoc(item)

    return doc ? [{ doc, key: `${item.relationTo}-${doc.id}` }] : []
  })

  // Same query — and so the same order — as the projects section, so
  // "previous" and "next" match the list the visitor came from.
  const { previous, next } = getAdjacentBySlug(await getAllProjects(locale), project.slug)
  const toAdjacentItem = (adjacent: typeof previous) => {
    if (!adjacent) {
      return null
    }

    const adjacentCategory =
      typeof adjacent.category === 'object' && adjacent.category ? adjacent.category.name : null

    return {
      href: `/${locale}/projects/${adjacent.slug}`,
      imageAlt:
        typeof adjacent.coverImage === 'object' && adjacent.coverImage
          ? adjacent.coverImage.alt
          : adjacent.title,
      imageUrl: getMediaUrl(adjacent.coverImage) ?? null,
      darkImageUrl: getMediaUrl(adjacent.coverImageDark) ?? null,
      meta: [adjacentCategory, adjacent.year].filter(Boolean).join(' · ') || null,
      title: adjacent.title,
    }
  }

  return (
    // Previous/next slide the page in the direction of travel (the
    // links carry nav-back / nav-forward); any other way in keeps the
    // usual cross-fade.
    <ViewTransition
      default="none"
      enter={{ 'nav-back': 'nav-back', 'nav-forward': 'nav-forward', default: 'none' }}
      exit={{ 'nav-back': 'nav-back', 'nav-forward': 'nav-forward', default: 'none' }}
    >
      <article className="content-section">
        <ReadingProgress />
        <Container>
          <Reveal>
            {/* On phones the logo can't share the title's line — the column
              is too narrow — so it takes the free end of this one. */}
            <div className="flex items-center justify-between gap-4">
              <Link
                className="link-underline text-sm font-medium text-fg-muted transition hover:text-accent"
                // Back to this project's own card, not the top of the section:
                // the device morphs back into it, and a card far down the grid
                // isn't left off-screen.
                href={`/${locale}#project-${project.slug}`}
              >
                {dictionary.projects.backLabel}
              </Link>
              {mockupFrame && mockupUrl ? (
                <span className="sm:hidden">
                  <ProjectLogo
                    className="h-10 max-w-32"
                    image={project.coverImage}
                    imageDark={project.coverImageDark}
                    size={128}
                  />
                </span>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            {/* With a mockup as the opener, the cover — a transparent logo —
              takes the free space to the right of the title instead (above
              the title on phones, see the back link). */}
            <div className="mt-6 flex items-start justify-between gap-6 sm:gap-10">
              <div className="min-w-0 flex-1">
                {categoryLabel || project.year || statusLabel ? (
                  <p className="eyebrow">
                    {[categoryLabel, project.year, statusLabel].filter(Boolean).join(' · ')}
                  </p>
                ) : null}
                <AnimatedTitle title={project.title} />
                {project.shortDescription ? (
                  <p className="text-sm font-medium uppercase tracking-label text-fg-subtle">
                    {project.shortDescription}
                  </p>
                ) : null}
              </div>
              {mockupFrame && mockupUrl ? (
                <span className="hidden shrink-0 self-center sm:block">
                  <ProjectLogo
                    className="h-24 max-w-56 lg:h-28 lg:max-w-64"
                    image={project.coverImage}
                    imageDark={project.coverImageDark}
                    size={256}
                  />
                </span>
              ) : null}
            </div>
          </Reveal>

          {/* Not wrapped in <Reveal>: this is where the card's device or
            cover lands (named as in ProjectCard), and the browser snapshots
            it the moment the page commits — mid-fade, it would morph into an
            empty box. Plain <Image> for the cover for the same reason. */}
          {mockupFrame && mockupUrl ? (
            <DeviceMockup
              fallbackAlt={project.title}
              frame={mockupFrame}
              image={project.mockupImage}
              imageDark={project.mockupImageDark}
              priority
              transitionName={`project-media-${project.slug}`}
              videoLabels={{
                pause: dictionary.video.pauseLabel,
                play: dictionary.video.playLabel,
              }}
            />
          ) : imageUrl || darkImageUrl ? (
            <ViewTransition
              default="none"
              name={`project-media-${project.slug}`}
              share="media-morph"
            >
              <div className="relative mt-8 aspect-video overflow-hidden rounded-card bg-surface">
                {imageUrl ? (
                  <Image
                    alt={imageAlt}
                    className={`h-full w-full object-contain${darkImageUrl ? ' dark:hidden' : ''}`}
                    height={900}
                    priority
                    sizes="(min-width: 1200px) 1160px, 100vw"
                    src={imageUrl}
                    width={1600}
                  />
                ) : null}
                {darkImageUrl ? (
                  <Image
                    alt={imageAlt}
                    className="hidden h-full w-full object-contain dark:block"
                    height={900}
                    sizes="(min-width: 1200px) 1160px, 100vw"
                    src={darkImageUrl}
                    width={1600}
                  />
                ) : null}
              </div>
            </ViewTransition>
          ) : null}

          <Divider />

          <Reveal>
            <RichText content={project.description} />
          </Reveal>

          {technologies.length > 0 ? (
            <Reveal>
              <ul
                aria-label={`${project.title} ${dictionary.projects.technologiesAriaLabelSuffix}`}
                className="mt-8 flex flex-wrap gap-2"
              >
                {technologies.map((technology, index) => (
                  <TechChip
                    key={typeof technology === 'object' && technology ? technology.id : index}
                    technology={technology}
                    wrap
                  />
                ))}
              </ul>
            </Reveal>
          ) : null}

          {project.githubUrl || project.liveUrl ? (
            <Reveal>
              <div className="mt-8 flex flex-wrap gap-4">
                {project.githubUrl ? (
                  <a
                    className="link-underline text-sm font-medium text-fg transition hover:text-accent"
                    href={project.githubUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {dictionary.projects.githubLabel}
                  </a>
                ) : null}
                {project.liveUrl ? (
                  <a
                    className="link-underline text-sm font-medium text-fg transition hover:text-accent"
                    href={project.liveUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {dictionary.projects.liveLabel}
                  </a>
                ) : null}
              </div>
            </Reveal>
          ) : null}

          {gallery.length > 0 ? (
            <>
              <Divider />
              <Reveal>
                <MediaGallery
                  ariaLabel={`${project.title} ${dictionary.projects.galleryAriaLabelSuffix}`}
                  closeLabel={dictionary.lightbox.closeLabel}
                  images={gallery.map(({ doc, key }) => ({
                    id: key,
                    src: getMediaUrl(doc) ?? '',
                    alt: doc.alt,
                    mimeType: doc.mimeType,
                    placeholder: 'placeholder' in doc ? doc.placeholder : null,
                    width: doc.width ?? undefined,
                    height: doc.height ?? undefined,
                  }))}
                  nextLabel={dictionary.lightbox.nextLabel}
                  previousLabel={dictionary.lightbox.previousLabel}
                />
              </Reveal>
            </>
          ) : null}

          {previous || next ? (
            <>
              <Divider />
              <Reveal>
                <AdjacentNav
                  ariaLabel={dictionary.projects.adjacentNavAriaLabel}
                  imageFit="contain"
                  next={toAdjacentItem(next)}
                  nextLabel={dictionary.projects.nextProjectLabel}
                  previous={toAdjacentItem(previous)}
                  previousLabel={dictionary.projects.previousProjectLabel}
                />
              </Reveal>
            </>
          ) : null}
        </Container>
      </article>
    </ViewTransition>
  )
}
