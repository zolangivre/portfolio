import { Container } from '@/components/ui/Container'
import { RouteLoadingStatus } from '@/components/ui/RouteLoadingStatus'
import { Skeleton } from '@/components/ui/Skeleton'

export default function JournalLoading() {
  return (
    <section aria-hidden="true" className="content-section">
      <RouteLoadingStatus />
      <Container>
        <div className="section-header">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="mt-3 h-8 w-72 rounded-2xl" />
        </div>
        <div className="project-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="flex flex-col gap-4" key={index}>
              <Skeleton className="aspect-16/10 w-full rounded-[28px]" />
              <Skeleton className="h-3 w-1/3 rounded-full" />
              <Skeleton className="h-5 w-3/4 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-2/3 rounded-full" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
