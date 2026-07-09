import type { ReactNode } from 'react'

type ContainerProps = {
  children: ReactNode
  className?: string
}

/**
 * Centered, max-width content column. Full-width elements (backgrounds,
 * borders, blur/scroll effects) must live on the parent instead — this
 * component only ever constrains and centers what's inside it, so it never
 * clips a sibling or ancestor's background to its own width.
 */
export function Container({ children, className }: ContainerProps) {
  return (
    <div className={className ? `page-container ${className}` : 'page-container'}>{children}</div>
  )
}
