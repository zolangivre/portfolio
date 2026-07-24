import Image from 'next/image'
import Link from 'next/link'

import { TechChip } from '@/components/ui/TechChip'
import { getMediaUrl } from '@/lib/media'
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

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-border bg-bg-elevated shadow-lg shadow-black/5 transition duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 hover:border-accent-soft-border hover:shadow-[0_25px_60px_-15px_var(--accent-soft-border)]"
      data-cursor="pointer"
    >
      <Link className="flex flex-1 flex-col" href={detailHref}>
        <div className="relative aspect-16/10 overflow-hidden bg-surface">
          {imageUrl ? (
            <Image
              alt={imageAlt}
              className={`h-full w-full object-contain ${darkImageUrl ? ' dark:hidden' : ''}`}
              height={640}
              sizes="(min-width: 1024px) min(33vw, 375px), (min-width: 720px) 50vw, 100vw"
              src={imageUrl}
              width={960}
            />
          ) : null}
          {darkImageUrl ? (
            <Image
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

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="text-xl font-semibold text-fg">{project.title}</h3>
            {project.featured ? (
              <span className="shrink-0 rounded-full border border-accent-soft-border bg-accent-soft px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
                {dictionary.projects.featuredBadge}
              </span>
            ) : null}
          </div>

          {categoryLabel || project.year || statusLabel ? (
            <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-widest text-fg-subtle">
              {categoryLabel ? <span>{categoryLabel}</span> : null}
              {categoryLabel && project.year ? <span aria-hidden="true">·</span> : null}
              {project.year ? <span>{project.year}</span> : null}
              {(categoryLabel || project.year) && statusLabel ? (
                <span aria-hidden="true">·</span>
              ) : null}
              {statusLabel ? <span>{statusLabel}</span> : null}
            </p>
          ) : null}

          <p className="flex-1 text-justify text-sm leading-7 text-fg-muted">
            {typeof project.shortDescription === 'string' &&
            project.shortDescription.trim().length > 0
              ? project.shortDescription
              : dictionary.projects.fallbackDescription}
          </p>
        </div>
      </Link>

      <div className="flex flex-col gap-4 px-6 pb-6 sm:px-7 sm:pb-7">
        {project.technologies && project.technologies.length > 0 ? (
          <ul
            className="flex flex-wrap gap-2"
            aria-label={`${project.title} ${dictionary.projects.technologiesAriaLabelSuffix}`}
          >
            {project.technologies.map((technology, index) => (
              <TechChip
                key={typeof technology === 'object' && technology ? technology.id : index}
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
  )
}
