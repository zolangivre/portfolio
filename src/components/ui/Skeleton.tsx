type SkeletonProps = {
  className?: string
}

/**
 * Decorative placeholder block for loading.tsx skeletons. Pulse respects
 * prefers-reduced-motion via Tailwind's motion-safe: variant, so reduced-
 * motion users get a static block instead of an animated one.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`bg-surface motion-safe:animate-pulse${className ? ` ${className}` : ''}`}
    />
  )
}
