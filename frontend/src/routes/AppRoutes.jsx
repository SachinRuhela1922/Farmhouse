import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PublicLayout, ScrollToTop } from '@/components/layout/PublicLayout'
import { FullPageLoader } from '@/components/common/Primitives'
import { ProtectedRoute, AdminRoute, GuestOnlyRoute } from './guards'

const HomePage = lazy(() => import('@/pages/home/HomePage'))
const AboutPage = lazy(() => import('@/pages/about/AboutPage'))
const AccommodationPage = lazy(() => import('@/pages/accommodation/AccommodationPage'))
const AccommodationDetailPage = lazy(() => import('@/pages/accommodation/AccommodationDetailPage'))
const ExperiencesPage = lazy(() => import('@/pages/experiences/ExperiencesPage'))
const GalleryPage = lazy(() => import('@/pages/gallery/GalleryPage'))
const BookingPage = lazy(() => import('@/pages/booking/BookingPage'))
const ConfirmationPage = lazy(() => import('@/pages/booking/ConfirmationPage'))
const ContactPage = lazy(() => import('@/pages/contact/ContactPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const AdminLoginPage = lazy(() => import('@/pages/auth/AdminLoginPage'))

const AccountLayout = lazy(() => import('@/pages/customer/AccountLayout'))
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'))
const MyBookingsPage = lazy(() => import('@/pages/customer/MyBookingsPage'))
const MyBookingDetailPage = lazy(() => import('@/pages/customer/MyBookingDetailPage'))

const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminOverview = lazy(() => import('@/pages/admin/OverviewPage'))
const AdminBookings = lazy(() => import('@/pages/admin/BookingsPage'))
const AdminAccommodations = lazy(() => import('@/pages/admin/AccommodationsPage'))
const AdminExperiences = lazy(() => import('@/pages/admin/ExperiencesPage'))
const AdminGallery = lazy(() => import('@/pages/admin/GalleryPage'))
const AdminCustomers = lazy(() => import('@/pages/admin/CustomersPage'))
const AdminTestimonials = lazy(() => import('@/pages/admin/TestimonialsPage'))
const AdminContacts = lazy(() => import('@/pages/admin/ContactsPage'))
const AdminFaqs = lazy(() => import('@/pages/admin/FaqsPage'))
const AdminNewsletter = lazy(() => import('@/pages/admin/NewsletterPage'))
const AdminContent = lazy(() => import('@/pages/admin/ContentPage'))
const AdminSettings = lazy(() => import('@/pages/admin/SettingsPage'))

export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="accommodation" element={<AccommodationPage />} />
            <Route path="accommodation/:slug" element={<AccommodationDetailPage />} />
            <Route path="experiences" element={<ExperiencesPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="booking" element={<BookingPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />

            <Route element={<GuestOnlyRoute />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
            </Route>
            <Route path="forgot-password" element={<ForgotPasswordPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="booking/confirmation/:bookingId" element={<ConfirmationPage />} />
              <Route path="account" element={<AccountLayout />}>
                <Route index element={<ProfilePage />} />
                <Route path="bookings" element={<MyBookingsPage />} />
                <Route path="bookings/:bookingId" element={<MyBookingDetailPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="accommodations" element={<AdminAccommodations />} />
              <Route path="experiences" element={<AdminExperiences />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="contacts" element={<AdminContacts />} />
              <Route path="faqs" element={<AdminFaqs />} />
              <Route path="newsletter" element={<AdminNewsletter />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
