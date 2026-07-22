import { Container } from '@/components/ui/Container'
import { RouteLoadingStatus } from '@/components/ui/RouteLoadingStatus'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ProjectDetailLoading() {
  return (
    <article aria-hidden="true" className="content-section">
      <RouteLoadingStatus />
      <Container>
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="mt-6 h-3 w-48 rounded-full" />
        <Skeleton className="mt-3 h-10 w-3/4 max-w-xl rounded-2xl" />
        <Skeleton className="mt-3 h-4 w-1/2 max-w-sm rounded-full" />
        <Skeleton className="mt-8 aspect-video w-full rounded-[28px]" />
        <div className="mt-10 space-y-3">
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-5/6 rounded-full" />
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton className="h-7 w-20 rounded-full" key={index} />
          ))}
        </div>
      </Container>
    </article>
  )
}
