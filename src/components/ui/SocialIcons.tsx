import type { ReactElement } from 'react'

type IconProps = {
  className?: string
}

function GithubIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" height="16" viewBox="0 0 16 16" width="16">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

function LinkedinIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" height="16" viewBox="0 0 16 16" width="16">
      <rect height="13" rx="2.5" stroke="currentColor" strokeWidth="1.2" width="13" x="1.5" y="1.5" />
      <circle cx="5.2" cy="5.3" fill="currentColor" r="0.9" />
      <path d="M5.2 7.3v4.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
      <path
        d="M8.3 11.5V8.6c0-1.9 2.9-2 2.9 0v2.9M8.3 7.3v.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  )
}

function XIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" height="16" viewBox="0 0 16 16" width="16">
      <path d="M9.53 6.78 15.17.5h-1.34l-4.89 5.44L4.99.5H0l5.91 8.34L0 15.5h1.34l5.17-5.75 4.13 5.75H15.6L9.53 6.78Zm-1.83 2.03-.6-.83L2.13 1.4h2.05l3.83 5.32.6.83 4.98 6.92h-2.05L7.7 8.81Z" />
    </svg>
  )
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" height="16" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 16 16" width="16">
      <rect height="13" rx="3.5" width="13" x="1.5" y="1.5" />
      <circle cx="8" cy="8" r="3.2" />
      <circle cx="11.8" cy="4.2" fill="currentColor" r="0.9" stroke="none" />
    </svg>
  )
}

function DribbbleIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" height="16" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 16 16" width="16">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M2 9.8c4-1 8.4-.6 11.4 1M2.6 4.9c2 1.7 6.7 4 11.2 2.9M6.4 1.8c1.8 3 2.8 8 1.8 12.4" />
    </svg>
  )
}

function LinkIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" viewBox="0 0 16 16" width="16">
      <path d="M6.5 9.5 9.5 6.5" />
      <path d="M7.8 4.3 8.9 3.2a2.6 2.6 0 0 1 3.7 3.7l-1.1 1.1" />
      <path d="M8.2 11.7 7.1 12.8a2.6 2.6 0 1 1-3.7-3.7l1.1-1.1" />
    </svg>
  )
}

const ICONS_BY_PLATFORM: Record<string, (props: IconProps) => ReactElement> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  x: XIcon,
  instagram: InstagramIcon,
  dribbble: DribbbleIcon,
}

export function BuiltInSocialIcon({ className, platform }: IconProps & { platform: string }) {
  const Icon = ICONS_BY_PLATFORM[platform] ?? LinkIcon

  return <Icon className={className} />
}
