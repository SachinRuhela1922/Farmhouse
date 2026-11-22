import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, BedDouble, Sparkles, Images, Users, MessageSquareQuote, Inbox, HelpCircle, Mail,
  PanelsTopLeft, Settings, LogOut, Menu, ExternalLink,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/layout/Logo'
import { Seo } from '@/components/common/Seo'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { initials } from '@/utils/format'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays, badge: 'pending' },
  { to: '/admin/accommodations', label: 'Accommodations', icon: BedDouble },
  { to: '/admin/experiences', label: 'Experiences', icon: Sparkles },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { to: '/admin/contacts', label: 'Contact Messages', icon: Inbox, badge: 'new' },
  { to: '/admin/faqs', label: 'FAQs', icon: HelpCircle },
  { to: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { to: '/admin/content', label: 'Website Content', icon: PanelsTopLeft },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function SidebarNav({ counts, onNavigate }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6"><Logo to="/admin" /></div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Admin">
        {NAV.map(({ to, label, icon: I, end, badge }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) => cn('group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors', isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground')}>
            {({ isActive }) => (
              <>
                <I className={cn('size-4', isActive ? 'text-primary' : 'text-sidebar-foreground/50')} />
                <span className="flex-1">{label}</span>
                {badge && counts[badge] > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">{counts[badge]}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t p-3">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-sidebar-foreground/70 hover:bg-sidebar-accent/60"><ExternalLink className="size-4" /> View website</a>
        <button onClick={async () => { await logout(); navigate('/admin/login') }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-sidebar-foreground/70 hover:bg-rose-50 hover:text-rose-700"><LogOut className="size-4" /> Logout</button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { user, profile } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  // Sidebar badges (polled every 30s)
  const { data: badges } = useApi(['admin', 'stats'], '/admin/stats', { select: (r) => r.badges, refetchInterval: 30_000 })
  const counts = { pending: badges?.pending || 0, new: badges?.newContacts || 0 }
  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))
  useEffect(() => setOpen(false), [pathname])

  return (
    <div className="min-h-dvh bg-[oklch(0.975_0.008_85)]">
      <Seo title={`Admin · ${current?.label || 'Dashboard'}`} noindex />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block"><SidebarNav counts={counts} /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <SidebarNav counts={counts} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-background/85 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></Button>
            <h1 className="font-serif text-2xl">{current?.label || 'Dashboard'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{profile?.fullName || user?.displayName || 'Administrator'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials(profile?.fullName || user?.email)}</span>
          </div>
        </header>
        <main className="p-4 sm:p-8"><Outlet /></main>
      </div>
      <Link to="/" className="sr-only">Website</Link>
    </div>
  )
}
