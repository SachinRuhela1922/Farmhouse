import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { ShieldCheck, ShieldOff, PackagePlus, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Panel } from '@/components/admin/AdminUi'
import { useSettingsForm, SaveBar, TextField, SingleImageField, ListField } from '@/components/admin/SettingsForm'
import { Spinner } from '@/components/common/Primitives'
import { api } from '@/services/api/client'
import { useApi, useInvalidate } from '@/hooks/useApi'
import { SETTINGS_KEY } from '@/context/SiteSettingsContext'
import { isGoogleConfigured } from '@/services/firebase/config'
import { installStarterContent } from '@/services/content/contentService'
import { useAuth } from '@/context/AuthContext'

const num = (v) => (v === '' || v == null ? 0 : Number(v))

function GeneralTab() {
  const form = useSettingsForm((s) => ({ businessName: s.businessName, tagline: s.tagline, logoUrl: s.logoUrl }))
  return (
    <>
      <Panel title="Brand">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField form={form} name="businessName" label="Business name" />
          <TextField form={form} name="tagline" label="Tagline" />
          <div className="sm:col-span-2"><SingleImageField form={form} name="logoUrl" label="Logo (optional — leave empty to use the built-in mark)" folder="brand" /></div>
        </div>
      </Panel>
      <SaveBar form={form} />
    </>
  )
}

function BookingTab() {
  const form = useSettingsForm((s) => ({ bookingSettings: s.bookingSettings, taxSettings: s.taxSettings }))
  const transform = ({ bookingSettings: b, taxSettings: t }) => ({
    bookingSettings: {
      ...b,
      minNights: Math.max(1, num(b.minNights)), maxNights: Math.max(1, num(b.maxNights)), maxAdvanceDays: Math.max(1, num(b.maxAdvanceDays)),
      advancePaymentPercent: Math.min(100, Math.max(0, num(b.advancePaymentPercent))),
      services: (b.services || []).filter((s) => s.name).map((s) => ({ ...s, id: s.id || s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), price: num(s.price) })),
    },
    taxSettings: { ...t, taxPercent: num(t.taxPercent), serviceChargePercent: num(t.serviceChargePercent), cleaningFee: num(t.cleaningFee) },
  })
  return (
    <div className="space-y-6">
      <Panel title="Booking rules" description="Enforced server-side by the createBooking Cloud Function.">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField form={form} name="bookingSettings.minNights" label="Minimum nights" type="number" min="1" />
          <TextField form={form} name="bookingSettings.maxNights" label="Maximum nights" type="number" min="1" />
          <TextField form={form} name="bookingSettings.maxAdvanceDays" label="Book up to (days ahead)" type="number" min="1" />
          <TextField form={form} name="bookingSettings.checkInTime" label="Check-in time" />
          <TextField form={form} name="bookingSettings.checkOutTime" label="Check-out time" />
          <TextField form={form} name="bookingSettings.advancePaymentPercent" label="Advance payment (%)" type="number" min="0" max="100" />
          <div className="grid gap-2"><Label className="text-[13px]">Currency</Label>
            <Controller control={form.control} name="bookingSettings.currency" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{['INR', 'USD', 'EUR', 'GBP', 'AED'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            )} />
          </div>
          <TextField form={form} name="bookingSettings.timezone" label="Timezone (IANA)" placeholder="Asia/Kolkata" />
          <label className="flex items-center gap-3 self-end pb-2 text-sm"><Controller control={form.control} name="bookingSettings.requireVerifiedEmail" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} /> Require verified email</label>
          <TextField form={form} name="bookingSettings.cancellationPolicy" label="Cancellation policy" textarea className="sm:col-span-3" />
        </div>
      </Panel>
      <Panel title="Taxes & charges" description="Applied to every quote and booking.">
        <div className="grid gap-4 sm:grid-cols-4">
          <TextField form={form} name="taxSettings.taxLabel" label="Tax label" />
          <TextField form={form} name="taxSettings.taxPercent" label="Tax %" type="number" min="0" step="0.01" />
          <TextField form={form} name="taxSettings.serviceChargePercent" label="Service charge %" type="number" min="0" step="0.01" />
          <TextField form={form} name="taxSettings.cleaningFee" label="Cleaning fee (flat)" type="number" min="0" />
        </div>
      </Panel>
      <Panel title="Additional services" description="Guests can add these at booking. Prices are recalculated on the server.">
        <ListField form={form} name="bookingSettings.services" fields={[
          { key: 'name', placeholder: 'Service name' },
          { key: 'price', placeholder: 'Price' },
          { key: 'unit', render: (n, f) => (
            <Controller control={f.control} name={n} render={({ field }) => (
              <Select value={field.value || 'per_booking'} onValueChange={field.onChange}>
                <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="per_booking">Per stay</SelectItem><SelectItem value="per_night">Per night</SelectItem><SelectItem value="per_guest">Per guest</SelectItem><SelectItem value="per_guest_night">Per guest per night</SelectItem></SelectContent>
              </Select>
            )} />
          ) },
        ]} empty={{ id: '', name: '', price: 0, unit: 'per_booking' }} addLabel="Add service" />
      </Panel>
      <SaveBar form={form} transform={transform} />
    </div>
  )
}

function AdminsTab() {
  const { user, refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(null)
  const { data: admins, loading, error, refetch } = useApi(['admin', 'admins'], '/admin/admins', { select: (r) => r.items })

  const setRole = async (target, admin) => {
    setBusy(target + admin)
    try {
      await api.post('/admin/admins', { email: target, admin })
      toast.success(admin ? `${target} is now an administrator` : `Admin access removed for ${target}`)
      setEmail('')
      await refetch()
      if (target === user.email) await refreshUser()
    } catch (e) { toast.error(e.message) } finally { setBusy(null) }
  }

  return (
    <Panel title="Administrators" description="Roles are stored in MongoDB and checked by the API on every request. The person must already have an account (email or Google); access applies immediately."
      actions={<Button variant="ghost" size="sm" onClick={() => refetch()}><RefreshCw /> Refresh</Button>}>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (email) setRole(email.trim().toLowerCase(), true) }}>
        <Input type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
        <Button type="submit" disabled={!email || !!busy}>{busy?.endsWith('true') ? <Spinner className="size-4 text-current" /> : <ShieldCheck />} Grant admin</Button>
      </form>
      <ul className="mt-6 divide-y rounded-xl border">
        {loading ? <li className="p-4"><Spinner /></li> : error ? <li className="p-4 text-sm text-destructive">{error.message}</li> : (admins || []).map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <span><span className="font-medium">{a.fullName}</span> <span className="text-muted-foreground">{a.email}</span>{a.id === user.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</span>
            {a.id !== user.id && <Button size="sm" variant="ghost" className="text-destructive" disabled={!!busy} onClick={() => setRole(a.email, false)}><ShieldOff /> Revoke</Button>}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function DemoDataPanel() {
  const invalidate = useInvalidate()
  const { data: demo, refetch } = useApi(['admin', 'demo'], '/admin/demo')
  const [busy, setBusy] = useState(null)
  const run = async (key, fn, msg) => {
    setBusy(key)
    try { await fn(); await invalidate('public', 'admin', 'bookings', 'availability', SETTINGS_KEY); await refetch(); toast.success(msg) } catch (e) { toast.error(e.message) } finally { setBusy(null) }
  }
  const has = demo && demo.bookings + demo.users + demo.contacts + demo.newsletter > 0
  return (
    <Panel title="Demo data" description="Fills every section with realistic sample data — customers, bookings in every status across 12 months, payments & refunds, enquiries and subscribers — so you can try every screen. All demo records use @demo.local emails and can be removed in one click. Real data is never touched.">
      {demo && (
        <p className="mb-4 text-sm text-muted-foreground">
          Currently: <b className="text-foreground">{demo.users}</b> demo users · <b className="text-foreground">{demo.bookings}</b> bookings · <b className="text-foreground">{demo.contacts}</b> enquiries · <b className="text-foreground">{demo.newsletter}</b> subscribers
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={!!busy} onClick={() => run('load', () => api.post('/admin/demo'), has ? 'Demo data refreshed' : 'Demo data loaded — explore the dashboard!')}>
          {busy === 'load' ? <Spinner className="size-4 text-current" /> : <PackagePlus />} {has ? 'Reload demo data' : 'Load demo data'}
        </Button>
        {has && (
          <Button variant="outline" className="text-destructive" disabled={!!busy} onClick={() => run('remove', () => api.del('/admin/demo'), 'Demo data removed')}>
            {busy === 'remove' ? <Spinner className="size-4" /> : <XCircle />} Remove demo data
          </Button>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Demo logins — customer: <code>riya@demo.local</code> / <code>Demo12345</code> · admin: <code>admin@demo.local</code> / <code>Admin12345</code></p>
    </Panel>
  )
}

function SystemTab() {
  const [busy, setBusy] = useState(false)
  const invalidate = useInvalidate()
  const { data: sys, refetch } = useApi(['admin', 'system'], '/admin/system')
  const checks = [
    { label: 'MongoDB Atlas', ok: sys?.database === 'connected', note: sys ? `Database ${sys.database}` : 'Checking…' },
    { label: 'Google sign-in (server: FIREBASE_PROJECT_ID, web: VITE_FIREBASE_*)', ok: sys?.googleAuth?.configured && isGoogleConfigured, note: `Server ${sys?.googleAuth?.configured ? 'ready' : 'not configured'} · Web ${isGoogleConfigured ? 'ready' : 'not configured'}` },
    { label: 'Email delivery (SMTP)', ok: sys?.email?.configured, note: sys ? `${sys.email.configured ? 'Configured' : 'Not configured — emails are NOT being sent'} · ${sys.email.sent} sent, ${sys.email.notSent} not delivered` : '' },
    { label: 'Razorpay payments', ok: sys?.payments?.configured, note: sys?.payments?.configured ? 'Keys present on the server' : 'Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in backend/.env' },
    { label: 'Site URL (sitemap & canonical)', ok: !!import.meta.env.VITE_SITE_URL && !import.meta.env.VITE_SITE_URL.includes('your-domain'), note: import.meta.env.VITE_SITE_URL },
  ]
  return (
    <div className="space-y-6">
      <Panel title="Starter content" description="Fills empty collections (accommodations, experiences, gallery, testimonials, FAQs, site settings) with complete, editable starter content. Existing data is never overwritten.">
        <Button disabled={busy} onClick={async () => {
          setBusy(true)
          try {
            const r = await installStarterContent()
            await invalidate('public', 'admin', SETTINGS_KEY)
            toast.success(r.length ? `Installed: ${r.join(', ')}` : 'Nothing to install — all collections already have content.')
          } catch (e) { toast.error(e.message) } finally { setBusy(false) }
        }}>{busy ? <Spinner className="size-4 text-current" /> : <PackagePlus />} Install starter content</Button>
      </Panel>
      <DemoDataPanel />
      <Panel title="Integration status" actions={<Button variant="ghost" size="sm" onClick={() => refetch()}><RefreshCw /> Re-check</Button>}>
        <ul className="space-y-3 text-sm">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-3">
              {c.ok ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> : <XCircle className="size-5 shrink-0 text-amber-600" />}
              <span><span className="font-medium">{c.label}</span>{c.note && <span className="block text-xs text-muted-foreground">{c.note}</span>}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Tabs defaultValue="general">
      <TabsList className="mb-6 flex-wrap">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="booking">Booking & taxes</TabsTrigger>
        <TabsTrigger value="admins">Administrators</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
      </TabsList>
      <TabsContent value="general"><GeneralTab /></TabsContent>
      <TabsContent value="booking"><BookingTab /></TabsContent>
      <TabsContent value="admins"><AdminsTab /></TabsContent>
      <TabsContent value="system"><SystemTab /></TabsContent>
    </Tabs>
  )
}
