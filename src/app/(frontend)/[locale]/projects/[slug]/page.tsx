import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AnimatedTitle } from '@/components/ui/AnimatedTitle'
import { TechChip } from '@/components/ui/TechChip'
import { Container } from '@/components/ui/Container'
import { Divider } from '@/components/ui/Divider'
import { FadeImage } from '@/components/ui/FadeImage'
import { MediaGallery } from '@/components/ui/MediaGallery'
import { Reveal } from '@/components/ui/Reveal'
import { RichText } from '@/components/ui/RichText'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import { getAllProjects, getProject, getSectionsVisibility } from '@/lib/queries'
import type { Media } from '@/payload-types'

export const revalidate = 60

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

  const imageUrl = getMediaUrl(project.meta?.image ?? project.coverImage)

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
  const categoryLabel =
    typeof project.category === 'object' && project.category ? project.category.name : null
  const statusLabel = project.status
    ? (dictionary.projects.statusLabels[project.status] ?? project.status)
    : null
  const technologies = project.technologies ?? []
  const gallery = (project.gallery ?? []).filter(
    (item): item is Media => typeof item === 'object' && item !== null,
  )

  return (
    <article className="content-section">
      <Container>
        <Reveal>
          <Link
            className="link-underline text-sm font-medium text-fg-muted transition hover:text-accent"
            href={`/${locale}#projects`}
          >
            {dictionary.projects.backLabel}
          </Link>
        </Reveal>

        <Reveal delay={0.08}>
          <div>
            {categoryLabel || project.year || statusLabel ? (
              <p className="eyebrow mt-6">
                {[categoryLabel, project.year, statusLabel].filter(Boolean).join(' · ')}
              </p>
            ) : null}
            <AnimatedTitle title={project.title} />
            {project.shortDescription ? (
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-fg-subtle">
                {project.shortDescription}
              </p>
            ) : null}
          </div>
        </Reveal>

        {imageUrl || darkImageUrl ? (
          <Reveal delay={0.16}>
            <div className="relative mt-8 aspect-video overflow-hidden rounded-[28px] bg-surface">
              {imageUrl ? (
                <FadeImage
                  alt={imageAlt}
                  className={`h-full w-full object-contain${darkImageUrl ? ' dark:hidden' : ''}`}
                  height={900}
                  priority
                  src={imageUrl}
                  width={1600}
                />
              ) : null}
              {darkImageUrl ? (
                <FadeImage
                  alt={imageAlt}
                  className="hidden h-full w-full object-contain dark:block"
                  height={900}
                  priority
                  src={darkImageUrl}
                  width={1600}
                />
              ) : null}
            </div>
          </Reveal>
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
                images={gallery.map((media) => ({
                  id: media.id,
                  src: getMediaUrl(media) ?? '',
                  alt: media.alt,
                  mimeType: media.mimeType,
                  width: media.width ?? undefined,
                  height: media.height ?? undefined,
                }))}
                nextLabel={dictionary.lightbox.nextLabel}
                previousLabel={dictionary.lightbox.previousLabel}
              />
            </Reveal>
          </>
        ) : null}
      </Container>
    </article>
  )
}
