# Willowmere Farmhouse — Website, Booking Engine & Admin

Premium farmhouse website with a real backend: JWT auth (email/password + Google), server-validated bookings with double-booking protection, Razorpay payments, full admin CMS and analytics.

```
Farmhouse/
├── frontend/   React 19 + Vite (JSX) · Tailwind v4 · shadcn/ui · Framer Motion · TanStack Query · RHF + Zod
└── backend/    Node 22+ · Express 5 · MongoDB Atlas (Mongoose 9) · JWT · Firebase Admin (Google token check only)
```

| Concern | Where it lives |
|---|---|
| All data (users, bookings, content, settings, payments) | **MongoDB Atlas** |
| Images & videos uploaded by admins | **MongoDB GridFS** (served at `/api/media/:id`) |
| Email/password auth | Backend — bcrypt + **JWT** (15-min access token + rotating httpOnly refresh cookie) |
| Google sign-in | **Firebase Auth** popup → backend verifies the ID token → issues our own JWT |
| Emails | Backend SMTP (Nodemailer) |
| Payments | Razorpay (orders + signature verification on the backend) |

---

## 1. Quick start

```bash
npm run install:all                     # installs backend + frontend

# Option A — try it instantly, no Atlas needed (in-memory DB, data resets on stop)
npm run dev:backend:memory              # seeds content + demo admin: admin@demo.local / Admin12345

# Option B — real MongoDB Atlas
cp backend/.env.example backend/.env    # fill MONGODB_URI + JWT secrets (see §2)
npm run seed                            # loads the full starter content into Atlas
npm run dev:backend                     # http://localhost:5000

# In a second terminal
cp frontend/.env.example frontend/.env
npm run dev:frontend                    # http://localhost:5173  (proxies /api → :5000)
```

## 2. Configuration

### backend/.env
| Variable | Notes |
|---|---|
| `MONGODB_URI` | Atlas → Connect → Drivers. Include the DB name, e.g. `…mongodb.net/farmhouse?retryWrites=true&w=majority`. Atlas → Network Access must allow your server IP. |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | 32+ random chars each: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `CLIENT_URL` | Frontend origin(s), comma-separated (CORS + links in emails) |
| `COOKIE_SAMESITE` / `COOKIE_SECURE` | `lax`/`false` locally. If the API is on a **different domain** than the site: `none` / `true` (HTTPS). |
| `FIREBASE_PROJECT_ID` | Enables Google sign-in verification (no service account needed) |
| `SMTP_*`, `MAIL_FROM` | Any SMTP provider. Empty = emails not sent (logged in `emaillogs`; dev prints verify/reset links to the console) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Test keys first. Webhook URL: `https://<api-domain>/api/payments/webhook` (events `payment.captured`, `refund.processed`, `refund.failed`) |

### frontend/.env
| Variable | Notes |
|---|---|
| `VITE_API_URL` | Empty in dev (proxy). In production: API origin if on another domain, else empty. |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | Web-app config, used **only** for the Google popup. Without them the Google button is hidden. |
| `VITE_SITE_URL` | Used for `sitemap.xml`, `robots.txt`, canonical links |

### Google sign-in setup (Firebase)
1. Firebase Console → create project → **Authentication → Sign-in method → Google → Enable**.
2. Authentication → Settings → **Authorized domains**: add `localhost` and your production domain.
3. Project settings → Your apps → add **Web app** → copy values into `frontend/.env`; put the project id in `backend/.env` (`FIREBASE_PROJECT_ID`).
No Firestore/Storage/Functions are used.

### First admin
Register on the website (email or Google), then:
```bash
npm run set-admin --prefix backend -- owner@example.com
```
More admins can be added in **Admin → Settings → Administrators**. Roles are stored in MongoDB and re-checked on every API request (never trusted from the client or the token alone).

## 3. Data & starter content
`npm run seed` fills empty collections with the full starter content: 4 accommodations, 10 experiences, 12 gallery images, 4 testimonials, 7 FAQs and all site settings (hero, about, contact, pricing, booking rules, taxes, services). `npm run seed -- --reset` (in `backend/`) wipes and re-seeds **content only** — users and bookings are untouched. The same "Install starter content" button exists in Admin → Settings → System. Everything is editable from the admin.

**Collections:** `users`, `refreshtokens`, `bookings`, `nightlocks`, `payments`, `paymentorders`, `accommodations`, `experiences`, `galleries`, `testimonials`, `faqs`, `contacts`, `newsletters`, `sitesettings`, `emaillogs`, `media.files/media.chunks` (GridFS).

## 4. How the important parts work
**Double-booking prevention** — every booked night is a `nightlocks` document with a **unique index on (accommodation, date)**. `createBooking` inserts the night locks and the booking inside a **MongoDB transaction**; if any night is taken (even by a concurrent request) the insert fails and everything rolls back → `409`. Rejected/cancelled bookings delete their locks. (Atlas clusters support transactions; the integration test fires 5 simultaneous requests and asserts exactly one wins.)

**Never trusting the client** — price, weekend rates, services, service charge, cleaning fee, tax, advance amount, availability, capacity, min/max nights, advance window and verified-email requirement are computed/enforced on the server. Payment orders use the stored booking amount, and Razorpay payments are verified by HMAC signature **and** re-fetched from Razorpay before being recorded (idempotent by payment id).

**Auth security** — bcrypt (12 rounds), short-lived access JWT kept in memory, refresh token in an httpOnly cookie that **rotates** on every use with reuse detection (stolen token → whole session family revoked), password change/reset revokes all sessions, hashed single-use tokens for email verification (24h) and password reset (1h), rate-limited auth endpoints, `role` never accepted from signup.

**Uploads** — admin-only, magic-byte sniffing (a renamed file can't pose as an image), size limits (images 15 MB, MP4/WebM 100 MB), stored in GridFS, served with long cache headers and HTTP Range support; deleting/replacing content cleans up unused files.

## 5. API overview
| | |
|---|---|
| `POST /api/auth/register · login · google · refresh · logout · logout-all · verify-email · resend-verification · forgot-password · reset-password` | Auth |
| `GET/PATCH /api/auth/me`, `POST /api/auth/me/password` | Profile |
| `GET /api/settings · accommodations[/:slug] · experiences · gallery · testimonials · faqs · availability/:id · media/:id` | Public |
| `POST /api/contact · newsletter` | Public submissions (rate-limited) |
| `POST /api/bookings/quote`, `POST /api/bookings`, `GET /api/bookings/mine · /:id · /:id/payments`, `POST /api/bookings/:id/cancel` | Bookings |
| `POST /api/payments/order · verify · webhook` | Razorpay |
| `/api/admin/*` — stats, bookings (+status, refund, offline payment), content CRUD + reorder, media, customers, contacts, newsletter, settings, admins, seed, system | Admin only |

## 6. Testing
```bash
npm test                          # backend: 20 tests (unit + full API integration on a real in-memory MongoDB replica set)
npm run lint --prefix frontend    # ESLint
npm run build                     # production build
```
The first `npm test` downloads a MongoDB binary (~a few minutes, cached afterwards).

## 7. Deployment
* **Backend** (Render, Railway, Fly.io, a VPS…): `cd backend && npm ci && npm start`, set the env vars, `NODE_ENV=production`. Allow the host's IP in Atlas Network Access. Use HTTPS.
* **Frontend** (Vercel, Netlify, Firebase Hosting, Nginx…): `cd frontend && npm ci && npm run build` → deploy `dist/` with an SPA fallback to `index.html`.
  * Same domain (recommended): route `/api/*` to the backend with your host's rewrite/proxy → keep `COOKIE_SAMESITE=lax`.
  * Different domains: set `VITE_API_URL=https://api.your-domain.com`, `CLIENT_URL=https://your-domain.com`, `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`.
* Running several API instances? Set `RUN_JOBS=false` on all but one (daily maintenance job).

## 8. Needs your credentials
| Feature | Needs |
|---|---|
| Database | MongoDB Atlas connection string |
| Google sign-in | Firebase project (Google provider enabled) |
| Sending emails (verification, reset, booking updates) | SMTP credentials |
| Online payments & refunds | Razorpay key id / secret / webhook secret |
