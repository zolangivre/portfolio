import Link from 'next/link'
import { ViewTransition } from 'react'

import { buttonClassName } from '@/components/ui/Button'
import { cardClassName, cardFrameClassName } from '@/components/ui/Card'
import { DeviceMockup } from '@/components/ui/DeviceMockup'
import { Pill } from '@/components/ui/Pill'
import { ProjectLogo } from '@/components/ui/ProjectLogo'
import { SafeImage } from '@/components/ui/SafeImage'
import { presentTechnologies, TechChip } from '@/components/ui/TechChip'
import { getMediaUrl, getRelationUrl } from '@/lib/media'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import type { Project } from '@/payload-types'

type ProjectCardProps = {
  dictionary: Dictionary
  /**
   * A featured project's card: from 720px it spans the section, the device
   * on one side and the text on the other, with the live site as a button.
   * On phones it is a card like the others, first in the row.
   */
  featured?: boolean
  locale: Locale
  /** Featured only: the device on the right, so a run of them alternates. */
  mediaRight?: boolean
  project: Project
}

const linkClassName = 'link-underline text-sm font-medium text-fg transition hover:text-accent'

export function ProjectCard({
  dictionary,
  featured = false,
  locale,
  mediaRight = false,
  project,
}: ProjectCardProps) {
  const imageUrl = getMediaUrl(project.coverImage)
  const technologies = presentTechnologies(project.technologies)
  const darkImageUrl = getMediaUrl(project.coverImageDark)
  const imageAlt =
    typeof project.coverImage === 'object' && project.coverImage
      ? project.coverImage.alt
      : project.title
  const statusLabel = project.status
    ? (dictionary.projects.statusLabels[project.status] ?? project.status)
    : null
  const categoryLabel =
    typeof project.category === 'object' && project.category ? project.category.name : null
  const detailHref = `/${locale}/projects/${project.slug}`
  // The card shows the project running in its device (same as the opener of
  // its page, so the two morph into each other); the cover — usually a logo
  // — only when there's no mockup, and otherwise sits by the page's title.
  const mockupFrame =
    project.mockupFrame && project.mockupFrame !== 'none' ? project.mockupFrame : null
  const hasMockup = Boolean(
    mockupFrame && (getRelationUrl(project.mockupImage) ?? getRelationUrl(project.mockupImageDark)),
  )
  const transitionName = `project-media-${project.slug}`
  const coverSizes = featured
    ? '(min-width: 1024px) 660px, (min-width: 720px) 55vw, 100vw'
    : '(min-width: 1024px) min(33vw, 375px), (min-width: 720px) 50vw, 100vw'
  // Featured, the media fills the left column from 720px, as tall as the text
  // beside it; above it on phones, like every card.
  const mediaBoxClassName = featured
    ? 'relative aspect-16/10 overflow-hidden rounded-t-card bg-surface md:aspect-auto md:h-full md:min-h-80 md:rounded-none'
    : 'relative aspect-16/10 overflow-hidden rounded-t-card bg-surface'

  const media =
    mockupFrame && hasMockup ? (
      <div className={mediaBoxClassName}>
        <DeviceMockup
          fallbackAlt={imageAlt}
          frame={mockupFrame}
          image={project.mockupImage}
          imageDark={project.mockupImageDark}
          transitionName={transitionName}
          variant={featured ? 'featured' : 'card'}
          videoLabels={{
            pause: dictionary.video.pauseLabel,
            play: dictionary.video.playLabel,
          }}
        />
      </div>
    ) : (
      // Same name as the cover on the project page: navigating between
      // them, the browser morphs one into the other.
      <ViewTransition default="none" name={transitionName} share="media-morph">
        <div className={mediaBoxClassName}>
          {imageUrl ? (
            <SafeImage
              alt={imageAlt}
              className={`h-full w-full object-contain ${darkImageUrl ? ' dark:hidden' : ''}`}
              height={640}
              sizes={coverSizes}
              src={imageUrl}
              width={960}
            />
          ) : null}
          {darkImageUrl ? (
            <SafeImage
              alt={imageAlt}
              className="hidden h-full w-full object-contain dark:block"
              height={640}
              sizes={coverSizes}
              src={darkImageUrl}
              width={960}
            />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-bg/70 via-bg/5 to-transparent" />
        </div>
      </ViewTransition>
    )

  const body = (
    <div className={`flex flex-1 flex-col ${featured ? 'p-6 sm:p-7 md:p-9' : 'p-6 sm:p-7'}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          {/* The logo moves here when the media area shows the device. */}
          {hasMockup ? (
            <ProjectLogo
              className={featured ? 'h-10 max-w-28 shrink-0' : 'h-9 max-w-24 shrink-0'}
              image={project.coverImage}
              imageDark={project.coverImageDark}
              size={featured ? 112 : 96}
            />
          ) : null}
          {/* A title that doesn't fit beside the logo drops under it;
              one that doesn't fit the card at all ("BagBuddyMarket-
              placeDashboard", or a large text size) breaks inside it
              instead of running under its edge. */}
          <h3
            className={`mb-0 min-w-0 font-semibold text-fg wrap-break-word ${
              featured ? 'text-xl md:text-2xl' : 'text-xl'
            }`}
          >
            {project.title}
          </h3>
        </div>
        {project.featured ? (
          <Pill className="shrink-0" tone="accent">
            {dictionary.projects.featuredBadge}
          </Pill>
        ) : null}
      </div>

      {categoryLabel || project.year || statusLabel ? (
        // The dots live in CSS (.dot-list), so a wrapped line never
        // starts or ends on one.
        <p className="dot-list mb-4 items-center gap-y-1 text-label uppercase text-fg-subtle">
          {categoryLabel ? <span>{categoryLabel}</span> : null}
          {project.year ? <span>{project.year}</span> : null}
          {statusLabel ? <span>{statusLabel}</span> : null}
        </p>
      ) : null}

      {/* The wrapper takes the card's spare height, not the text: a
          stretched line-clamp box shows a fourth line under the "…". */}
      <div className="flex-1">
        <p
          className={`line-clamp-3 text-fg-muted ${
            featured ? 'text-sm leading-7 md:line-clamp-4 md:text-base' : 'text-sm leading-7'
          }`}
        >
          {typeof project.shortDescription === 'string' &&
          project.shortDescription.trim().length > 0
            ? project.shortDescription
            : dictionary.projects.fallbackDescription}
        </p>
      </div>
    </div>
  )

  const footer = (
    <div
      className={`flex flex-col gap-4 ${featured ? 'px-6 pb-6 sm:px-7 sm:pb-7 md:px-9 md:pb-9' : 'px-6 pb-6 sm:px-7 sm:pb-7'}`}
    >
      {technologies.length > 0 ? (
        <ul
          className="flex flex-wrap gap-2"
          aria-label={`${project.title} ${dictionary.projects.technologiesAriaLabelSuffix}`}
        >
          {technologies.map((technology) => (
            <TechChip
              key={typeof technology === 'object' ? technology.id : technology}
              technology={technology}
            />
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {/* Featured, the live site is the card's one button: the way to see
            the real thing, straight from the homepage. */}
        {project.liveUrl ? (
          <a
            className={featured ? buttonClassName('primary', 'mr-2') : linkClassName}
            href={project.liveUrl}
            rel="noreferrer"
            target="_blank"
          >
            {dictionary.projects.liveLabel}
          </a>
        ) : null}
        {project.githubUrl ? (
          <a className={linkClassName} href={project.githubUrl} rel="noreferrer" target="_blank">
            {dictionary.projects.githubLabel}
          </a>
        ) : null}
        <Link className={linkClassName} href={detailHref}>
          {dictionary.projects.viewDetailsLabel}
        </Link>
      </div>
    </div>
  )

  return (
    // .card-glow's hover glow lives on an ::after — it needs an ancestor
    // without overflow-hidden (the article below clips the cover image to
    // its rounded corners, which would clip the glow's shadow too).
    // The id is where "back to projects" on this project's page returns to.
    <div className={cardFrameClassName('h-full scroll-mt-28')} id={`project-${project.slug}`}>
      {featured ? (
        <article
          className={cardClassName({
            className: `group flex h-full flex-col overflow-hidden md:grid ${
              mediaRight
                ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]'
                : 'md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]'
            }`,
          })}
          data-cursor="pointer"
        >
          {/* Two links to the same page, as the device can't share one with
              the text and the buttons beside it. This one is a larger target
              for the pointer only: out of the tab order and hidden from
              screen readers, which get the title's link. */}
          <Link
            aria-hidden="true"
            className={mediaRight ? 'block md:order-last' : 'block'}
            href={detailHref}
            tabIndex={-1}
          >
            {media}
          </Link>
          <div className="flex flex-col">
            <Link className="flex flex-1 flex-col" data-card-link href={detailHref}>
              {body}
            </Link>
            {footer}
          </div>
        </article>
      ) : (
        <article
          className={cardClassName({ className: 'group flex h-full flex-col overflow-hidden' })}
          data-cursor="pointer"
        >
          <Link className="flex flex-1 flex-col" data-card-link href={detailHref}>
            {media}
            {body}
          </Link>
          {footer}
        </article>
      )}
    </div>
  )
}
