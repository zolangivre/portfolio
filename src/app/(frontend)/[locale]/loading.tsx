import { Container } from '@/components/ui/Container'
import { RouteLoadingStatus } from '@/components/ui/RouteLoadingStatus'
import { Skeleton } from '@/components/ui/Skeleton'

export default function HomeLoading() {
  return (
    <>
      <RouteLoadingStatus />
      <section aria-hidden="true" className="hero-section">
        <Container className="lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="hero-copy w-full">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="mt-6 h-11 w-full max-w-xl rounded-2xl" />
            <Skeleton className="mt-3 h-11 w-3/4 max-w-lg rounded-2xl" />
            <Skeleton className="mt-6 h-4 w-full max-w-md rounded-full" />
            <Skeleton className="mt-2 h-4 w-2/3 max-w-sm rounded-full" />
            <div className="mt-8 flex flex-wrap gap-3">
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
          </div>
          <Skeleton className="mt-10 h-105 w-full max-w-sm shrink-0 rounded-4xl lg:mt-0 lg:w-80" />
        </Container>
      </section>

      <section aria-hidden="true" className="content-section">
        <Container>
          <div className="section-header">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="mt-3 h-8 w-64 rounded-2xl" />
          </div>
          <div className="project-grid">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="flex flex-col gap-4" key={index}>
                <Skeleton className="aspect-16/10 w-full rounded-[28px]" />
                <Skeleton className="h-5 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-2/3 rounded-full" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
