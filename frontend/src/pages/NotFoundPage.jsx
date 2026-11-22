import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Seo } from '@/components/common/Seo'

export default function NotFoundPage() {
  return (
    <section className="grid min-h-[80vh] place-items-center px-6 pt-28 pb-16 text-center">
      <Seo title="Page not found" noindex />
      <div>
        <p className="font-serif text-[9rem] leading-none text-primary/15 sm:text-[12rem]">404</p>
        <h1 className="-mt-6 text-4xl sm:text-5xl">This path leads into the orchard</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">The page you’re looking for has moved or never existed. Let’s get you back on the trail.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-full"><Link to="/">Back to home</Link></Button>
          <Button asChild size="lg" variant="outline" className="rounded-full"><Link to="/booking">Book a stay</Link></Button>
        </div>
      </div>
    </section>
  )
}
