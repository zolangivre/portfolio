import Link from 'next/link'
import { ViewTransition } from 'react'

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
  locale: Locale
  project: Project
}

export function ProjectCard({ dictionary, locale, project }: ProjectCardProps) {
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

  return (
    // .card-glow's hover glow lives on an ::after — it needs an ancestor
    // without overflow-hidden (the article below clips the cover image to
    // its rounded corners, which would clip the glow's shadow too).
    // The id is where "back to projects" on this project's page returns to.
    <div className={cardFrameClassName('h-full scroll-mt-28')} id={`project-${project.slug}`}>
      <article
        className={cardClassName({ className: 'group flex h-full flex-col overflow-hidden' })}
        data-cursor="pointer"
      >
        <Link className="flex flex-1 flex-col" data-card-link href={detailHref}>
          {mockupFrame && hasMockup ? (
            <div className="relative aspect-16/10 overflow-hidden rounded-t-card bg-surface">
              <DeviceMockup
                fallbackAlt={imageAlt}
                frame={mockupFrame}
                image={project.mockupImage}
                imageDark={project.mockupImageDark}
                transitionName={transitionName}
                variant="card"
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
              <div className="relative aspect-16/10 overflow-hidden rounded-t-card bg-surface">
                {imageUrl ? (
                  <SafeImage
                    alt={imageAlt}
                    className={`h-full w-full object-contain ${darkImageUrl ? ' dark:hidden' : ''}`}
                    height={640}
                    sizes="(min-width: 1024px) min(33vw, 375px), (min-width: 720px) 50vw, 100vw"
                    src={imageUrl}
                    width={960}
                  />
                ) : null}
                {darkImageUrl ? (
                  <SafeImage
                    alt={imageAlt}
                    className="hidden h-full w-full object-contain dark:block"
                    height={640}
                    sizes="(min-width: 1024px) min(33vw, 375px), (min-width: 720px) 50vw, 100vw"
                    src={darkImageUrl}
                    width={960}
                  />
                ) : null}
                <div className="absolute inset-0 bg-linear-to-t from-bg/70 via-bg/5 to-transparent" />
              </div>
            </ViewTransition>
          )}

          <div className="flex flex-1 flex-col p-6 sm:p-7">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                {/* The logo moves here when the media area shows the device. */}
                {hasMockup ? (
                  <ProjectLogo
                    className="h-9 max-w-24 shrink-0"
                    image={project.coverImage}
                    imageDark={project.coverImageDark}
                    size={96}
                  />
                ) : null}
                {/* A title that doesn't fit beside the logo drops under it;
                    one that doesn't fit the card at all ("BagBuddyMarket-
                    placeDashboard", or a large text size) breaks inside it
                    instead of running under its edge. */}
                <h3 className="mb-0 min-w-0 text-xl font-semibold text-fg wrap-break-word">
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

            <p className="line-clamp-3 flex-1 text-sm leading-7 text-fg-muted">
              {typeof project.shortDescription === 'string' &&
              project.shortDescription.trim().length > 0
                ? project.shortDescription
                : dictionary.projects.fallbackDescription}
            </p>
          </div>
        </Link>

        <div className="flex flex-col gap-4 px-6 pb-6 sm:px-7 sm:pb-7">
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
            <Link
              className="link-underline text-sm font-medium text-fg transition hover:text-accent"
              href={detailHref}
            >
              {dictionary.projects.viewDetailsLabel}
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
