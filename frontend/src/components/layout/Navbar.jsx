import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, UserRound, LogOut, LayoutDashboard, CalendarDays, ArrowRight, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { initials } from '@/utils/format'
import { Logo } from './Logo'
import { toast } from 'sonner'

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/accommodation', label: 'Stay' },
  { to: '/experiences', label: 'Experiences' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
]

/** Routes whose top section is a dark full-bleed image (navbar starts transparent/white). */
const DARK_HERO = [/^\/$/, /^\/about$/, /^\/accommodation$/, /^\/experiences$/, /^\/gallery$/, /^\/contact$/]

function AnnouncementBar() {
  const { settings } = useSiteSettings()
  const a = settings.announcement
  if (!a?.enabled || !a.text) return null
  const inner = (
    <span className="inline-flex items-center gap-2">
      <Megaphone className="size-3.5 shrink-0 opacity-70" />
      <span className="truncate">{a.text}</span>
      {a.link && <ArrowRight className="size-3.5 shrink-0" />}
    </span>
  )
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container-lux flex h-9 items-center justify-center text-[12.5px] font-medium tracking-wide">
        {a.link ? <Link to={a.link} className="min-w-0 hover:underline underline-offset-4">{inner}</Link> : inner}
      </div>
    </div>
  )
}

function UserMenu({ light }) {
  const { user, profile, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  if (!user)
    return (
      <Link to="/login" className={cn('hidden text-sm font-medium transition-colors sm:inline-flex', light ? 'text-white/90 hover:text-white' : 'text-foreground/80 hover:text-foreground')}>
        Sign in
      </Link>
    )
  const name = profile?.fullName || user.displayName || user.email
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn('grid size-9 place-items-center rounded-full text-xs font-semibold ring-1 transition', light ? 'bg-white/15 text-white ring-white/40 hover:bg-white/25' : 'bg-secondary text-primary ring-border hover:bg-accent')} aria-label="Account menu">
          {initials(name)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="truncate text-xs text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && <DropdownMenuItem onClick={() => navigate('/admin')}><LayoutDashboard /> Admin dashboard</DropdownMenuItem>}
        <DropdownMenuItem onClick={() => navigate('/account/bookings')}><CalendarDays /> My bookings</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/account')}><UserRound /> Profile</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={async () => { await logout(); toast.success('Signed out'); navigate('/') }}><LogOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const darkHero = DARK_HERO.some((r) => r.test(pathname))
  const light = darkHero && !scrolled && !open

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <AnnouncementBar />
      <div className={cn('transition-all duration-500', light ? 'bg-transparent' : 'border-b border-border/60 bg-background/85 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-xl')}>
        <nav className="container-lux flex h-[72px] items-center justify-between gap-6" aria-label="Main">
          <Logo light={light} />
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) => cn(
                    'relative rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors',
                    light ? 'text-white/85 hover:text-white' : 'text-foreground/70 hover:text-foreground',
                    isActive && (light ? 'text-white' : 'text-foreground'),
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {l.label}
                      {isActive && <motion.span layoutId="nav-dot" className={cn('absolute inset-x-4 -bottom-0.5 h-px', light ? 'bg-white' : 'bg-primary')} />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <UserMenu light={light} />
            <Button asChild size="lg" className={cn('hidden rounded-full px-6 transition-all hover:-translate-y-0.5 sm:inline-flex', light && 'bg-white text-primary hover:bg-white/90')}>
              <Link to="/booking">Book now</Link>
            </Button>
            <button
              onClick={() => setOpen((o) => !o)}
              className={cn('grid size-10 place-items-center rounded-full lg:hidden', light ? 'text-white' : 'text-foreground')}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="h-[calc(100dvh-72px)] overflow-y-auto border-t bg-background lg:hidden"
          >
            <div className="container-lux flex flex-col py-6">
              {NAV_LINKS.map((l, i) => (
                <motion.div key={l.to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <NavLink to={l.to} end={l.to === '/'} className={({ isActive }) => cn('flex items-center justify-between border-b py-4 font-serif text-3xl', isActive ? 'text-primary' : 'text-foreground')}>
                    {l.label}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </NavLink>
                </motion.div>
              ))}
              <div className="mt-8 grid gap-3">
                <Button asChild size="lg" className="h-12 rounded-full"><Link to="/booking">Book your stay</Link></Button>
                {!user && <Button asChild size="lg" variant="outline" className="h-12 rounded-full"><Link to="/login">Sign in</Link></Button>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
