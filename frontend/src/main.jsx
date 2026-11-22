import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { SiteSettingsProvider } from '@/context/SiteSettingsContext'
import AppRoutes from '@/routes/AppRoutes'
import '@/styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (count, err) => count < 2 && !(err?.status >= 400 && err?.status < 500),
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MotionConfig reducedMotion="user">
          <SiteSettingsProvider>
            <AuthProvider>
              <TooltipProvider delayDuration={200}>
                <AppRoutes />
                <Toaster position="top-center" richColors closeButton />
              </TooltipProvider>
            </AuthProvider>
          </SiteSettingsProvider>
        </MotionConfig>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
