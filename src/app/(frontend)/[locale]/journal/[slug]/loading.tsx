import { Container } from '@/components/ui/Container'
import { RouteLoadingStatus } from '@/components/ui/RouteLoadingStatus'
import { Skeleton } from '@/components/ui/Skeleton'

export default function JournalEntryLoading() {
  return (
    <article aria-hidden="true" className="content-section">
      <RouteLoadingStatus />
      <Container>
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="mt-6 h-3 w-40 rounded-full" />
        <Skeleton className="mt-3 h-10 w-3/4 max-w-xl rounded-2xl" />
        <Skeleton className="mt-3 h-4 w-1/2 max-w-sm rounded-full" />
        <Skeleton className="mt-8 aspect-video w-full rounded-[28px]" />
        <div className="mt-10 space-y-3">
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-5/6 rounded-full" />
          <Skeleton className="h-4 w-2/3 rounded-full" />
        </div>
      </Container>
    </article>
  )
}
