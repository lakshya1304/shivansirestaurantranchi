# 🍽️ Maa Tara Sweets Restaurant — Enhancement Plan in robust manner

> **Document Version:** 1.0  
> **Created:** 2026-08-28  
> **Scope:** Full-stack (Frontend: TanStack Start/TSX · Backend: Node + Prisma)

---

## Table of Contents

1. [QR-Based Order Flow Verification](#1-qr-based-order-flow-verification)
2. [Admin Approval & Kitchen Status Flow](#2-admin-approval--kitchen-status-flow)
3. [Bill Generation & Storage](#3-bill-generation--storage)
4. [Loyalty Program](#4-loyalty-program)
5. [Coupon Functionality Check](#5-coupon-functionality-check)
6. [SuperAdmin → Admin Promotion](#6-superadmin--admin-promotion)
7. [Input Placeholder Cleanup](#7-input-placeholder-cleanup)
8. [Toast Notification Fixes & Enhancements](#8-toast-notification-fixes--enhancements)
9. [Navbar — Profile Item](#9-navbar--profile-item)
10. [Full Menu — Category Filters & Backend Enum](#10-full-menu--category-filters--backend-enum)
11. [Footer — Clickable Phone Number](#11-footer--clickable-phone-number)
12. [QR Scanner — Camera UX Improvements](#12-qr-scanner--camera-ux-improvements)
13. [Owner Page — Established Year Fix](#13-owner-page--established-year-fix)
14. [Homepage — Remove Live Kitchen Tracking](#14-homepage--remove-live-kitchen-tracking)
15. [Product Rating by Users](#15-product-rating-by-users)
16. [Footer — Remove Stray "pp"/"app" Text](#16-footer--remove-stray-ppapp-text)
17. [Homepage Ratings — Real Backend Data](#17-homepage-ratings--real-backend-data)
18. [Status Indicator Dots](#18-status-indicator-dots)
19. [Homepage — QR Scan CTA in Ratings Section](#19-homepage--qr-scan-cta-in-ratings-section)
20. [Backend Audit — Proper Functions & Data Transfer](#20-backend-audit--proper-functions--data-transfer)
21. [Seed Script — Mock Data for Testing](#21-seed-script--mock-data-for-testing)

---

## 1. QR-Based Order Flow Verification

**Goal:** Confirm the full end-to-end order journey is intact and properly connected.

### Flow to verify

```
QR Code (table-specific) 
  → Redirect to /table/:tableNumber
  → Order form pre-filled with table number
  → User fills: name, phone, items
  → Submits order
  → Bill generated (with unique bill ID)
  → Payment selected (COD / prepaid / post-paid)
  → Order saved in DB
```

### Checklist

- [ ] Each QR code encodes the table number in the URL (e.g., `/table/3`)
- [ ] `table.$tableNumber.tsx` reads the param and pre-fills `tableNumber` in the cart/order form
- [ ] Phone & name fields are present and validated on the order form
- [ ] Order payload correctly carries `tableNumber`, `customerName`, `phone`, `items[]`, `paymentMode`
- [ ] Backend `POST /orders` saves all fields and returns a bill with a unique `billId`
- [ ] Payment modes: `COD`, `PREPAID`, `POSTPAID` — all accepted and stored correctly

---

## 2. Admin Approval & Kitchen Status Flow

**Goal:** After an order is placed, admin receives a notification, approves it, and the kitchen tracks it through statuses.

### Flow

```
Order placed
  → Admin notified (in-app bell + WhatsApp message to admin phone)
  → Admin approves order (changes status: PENDING → CONFIRMED)
  → Kitchen sees order (status: CONFIRMED → PREPARING)
  → Kitchen marks ready (PREPARING → PREPARED)
  → Served at table (PREPARED → SERVED)
  → Order marked COMPLETE
```

### Checklist

- [ ] **WhatsApp notification** sent to admin number on new order (`POST /orders` triggers WhatsApp API call)
- [ ] **In-app notification bell** in admin dashboard shows new orders in real-time (polling or WebSocket)
- [ ] Admin has an "Approve" button per order; clicking moves status `PENDING → CONFIRMED`
- [ ] Kitchen view (`/admin`) filters orders by `CONFIRMED`, `PREPARING`, `PREPARED`
- [ ] Kitchen can update status: CONFIRMED → PREPARING → PREPARED
- [ ] Admin/staff can mark order as SERVED
- [ ] Status changes are reflected in the customer's order tracking page (`/order/:orderId`)

### Backend Status Enum (Prisma)

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  PREPARED
  SERVED
  COMPLETED
  CANCELLED
}
```

---

## 3. Bill Generation & Storage

**Goal:** A proper bill is generated per order and saved for admin records.

### Checklist

- [ ] Every order has a `billId` (auto-generated, human-readable e.g., `BILL-20260828-0042`)
- [ ] Bill contains: items, quantities, prices, subtotal, discount (loyalty/coupon), taxes, total, payment mode, table number, customer name/phone, timestamp
- [ ] Bill is stored in DB (linked to the order via `orderId`)
- [ ] Admin can view/download bills from admin dashboard
- [ ] Customer receives bill summary on order confirmation page (`/order/:orderId`)
- [ ] Bill format is the **original/real format** (not a placeholder stub)

---

## 4. Loyalty Program

**Goal:** Reward returning customers with visit-based discounts on their current order.

### Discount Tiers (configurable by admin)

| Visit Number | Default Discount |
|:---:|:---:|
| 25th | 5% off |
| 50th | 10% off |
| 75th | 15% off |
| 100th | 20% off |

### Rules

- Discount applies **only on the milestone order** (the 25th, 50th, etc.), not cumulatively
- Tracked per **phone number** (since users may not always be logged in)
- Admin (and superadmin) can edit discount percentages via admin settings

### Checklist

- [ ] `User` model has `visitCount: Int` field (incremented on each completed order)
- [ ] `LoyaltyTier` model (or settings JSON) holds configurable thresholds and discount %
- [ ] On order placement, backend checks if `visitCount + 1` hits a milestone
- [ ] If milestone hit: discount auto-applied and shown to customer before payment
- [ ] Admin settings page has a "Loyalty Tiers" section to edit thresholds and percentages
- [ ] Loyalty discount is recorded on the bill

### Backend Model Addition

```prisma
model LoyaltyTier {
  id          String  @id @default(cuid())
  visitTarget Int     // e.g. 25, 50, 75, 100
  discountPct Float   // e.g. 5.0, 10.0, 15.0, 20.0
  updatedAt   DateTime @updatedAt
}
```

---

## 5. Coupon Functionality Check

**Goal:** Verify coupon codes work end-to-end and handle edge cases cleanly.

### Checklist

- [ ] Coupon input present in cart/checkout
- [ ] `POST /coupons/validate` endpoint exists and returns discount amount/type
- [ ] Expired coupons are rejected with a clear error message
- [ ] Single-use coupons are invalidated after redemption
- [ ] Coupon discount is shown line-item on the bill
- [ ] Coupon and loyalty discounts can stack (or are mutually exclusive — define policy)
- [ ] Admin can create/edit/deactivate coupons from admin dashboard (`/admin/offers`)

---

## 6. SuperAdmin → Admin Promotion

**Goal:** Any existing user can be elevated to admin by a superadmin; the user record is migrated to the admin collection/role.

### Checklist

- [ ] SuperAdmin sees a "Promote to Admin" button on any user in the Staff/Customers list
- [ ] On promotion: user's `role` field changes from `USER` → `ADMIN` in DB
- [ ] If separate admin DB/table exists, user record is copied/migrated there and original marked as promoted
- [ ] The newly promoted admin immediately gets admin dashboard access on next login
- [ ] Demotion (Admin → User) is also possible via superadmin
- [ ] Role changes are logged in an audit trail

### Backend Role Enum

```prisma
enum Role {
  USER
  STAFF
  ADMIN
  SUPERADMIN
}
```

---

## 7. Input Placeholder Cleanup

**Goal:** Replace all specific/example placeholder text with generic, instructional placeholders.

### Files to audit

- `cart.tsx` — order form (name, phone, table number fields)
- `auth.tsx` — login fields
- `login.tsx` — WhatsApp phone input
- `profile.tsx` — profile edit fields
- `admin.settings.tsx` — all setting inputs
- Any modal/form across the admin dashboard

### Rules

| Field Type | Generic Placeholder |
|:---|:---|
| Name | `Enter your name` |
| Phone | `Enter your phone number` |
| Email | `Enter your email address` |
| Table number | `Table number` |
| Address | `Enter your address` |
| Coupon code | `Enter coupon code` |
| Password | `Enter your password` |
| Search | `Search...` |

- [ ] Audit all `<input placeholder="...">` and `<textarea placeholder="...">` across frontend
- [ ] Replace any hardcoded demo values (e.g., `+91 98765 43210`, `admin@example.com`) with generic text

---

## 8. Toast Notification Fixes & Enhancements

**Goal:** Fix validation errors in toasts and improve the overall toast system UX.

### Bugs to Fix

- [ ] **Phone validation:** Toast shows "Invalid phone number format" even when the number is valid
  - Root cause: likely a regex mismatch or strict format assumption
  - Fix: accept `+91XXXXXXXXXX`, `91XXXXXXXXXX`, `XXXXXXXXXX` (10-digit) formats
- [ ] **Email error:** Toast shows `[object Object]` instead of a readable error message
  - Root cause: `error.message` is likely `error` (an object) being coerced to string
  - Fix: safely extract message with `error?.message ?? error?.toString() ?? 'Unknown error'`

### Toast System Enhancements

- [ ] **Swipe to dismiss** — swipe right (mobile) or click × to close immediately
- [ ] **Close button (×)** — visible on every toast
- [ ] **Auto-dismiss timer** — visible progress bar or countdown; default 4s for info/success, 6s for errors
- [ ] **Stack limit** — max 5–6 toasts visible at once; older ones drop off from bottom
- [ ] **User-friendly messages:**
  - Success: short, action-confirming ("Order placed!", "OTP sent")
  - Error: specific and actionable ("Phone must be 10 digits", "Email not found — try signing up")
  - Warning: contextual ("Session expiring soon")
- [ ] Toasts stack from bottom-right (or top-right), newest on top

---

## 9. Navbar — Profile Item

**Goal:** Add a "Profile" item in the navbar that is context-aware (login/signup vs. redirect to profile).

### Behaviour

| User State | Click Action |
|:---|:---|
| Not logged in | Open login/signup modal or redirect to `/login` |
| Logged in | Redirect to `/profile` |

### Checklist

- [ ] Add `Profile` link/button to the main navbar (both desktop and mobile hamburger menu)
- [ ] Use `useAuth` / cookie session to detect login state
- [ ] If logged in: show avatar/initials icon + "Profile" label → navigate to `/profile`
- [ ] If not logged in: show person icon + "Login" label → navigate to `/login`
- [ ] Active state styling when on `/profile` route

---

## 10. Full Menu — Category Filters & Backend Enum

**Goal:** Add category filters on the full menu page and sync categories with the backend enum.

### Categories to add

```
Sweets · Snacks · Drinks · Ice Creams · Desserts · South Indian
```

### Frontend (`menu.tsx`)

- [ ] Add a horizontal scrollable filter bar at the top of the full menu
- [ ] Filters: `All`, `Sweets`, `Snacks`, `Drinks`, `Ice Creams`, `Desserts`, `South Indian`
- [ ] Active filter is highlighted; clicking filters the displayed items client-side
- [ ] Persist selected filter in URL query param (`?category=sweets`) for shareability

### Backend (Prisma enum + controller)

```prisma
enum ProductCategory {
  ALL
  SWEETS
  SNACKS
  DRINKS
  ICE_CREAMS
  DESSERTS
  SOUTH_INDIAN
  OTHER
}
```

- [ ] Add `category: ProductCategory` field to `MenuItem`/`Product` model
- [ ] Migration: run `prisma migrate dev`
- [ ] `GET /menu?category=SWEETS` filters by category server-side
- [ ] Admin menu page allows setting category per item when creating/editing

---

## 11. Footer — Clickable Phone Number

**Goal:** The phone number in the footer should open the dialler on mobile.

### Change

```html
<!-- Before -->
<span>+91 XXXXX XXXXX</span>

<!-- After -->
<a href="tel:+91XXXXXXXXXX">+91 XXXXX XXXXX</a>
```

- [ ] Wrap phone number in `<a href="tel:...">` in `__root.tsx` footer
- [ ] Ensure the link is styled consistently with surrounding text (no underline by default, underline on hover)

---

## 12. QR Scanner — Camera UX Improvements

**Goal:** Make the QR scanner camera experience intuitive and permission-aware.

### Current Issues

- Camera may activate immediately without explicit user action
- No clear permission request flow if camera is denied

### New Behaviour

- [ ] On page load: show the scan box with a **"Click to open camera"** CTA overlay, camera is **not** started automatically
- [ ] User clicks inside the scan box → browser requests camera permission
- [ ] If permission **granted**: camera stream starts, overlay disappears, scanning begins
- [ ] If permission **denied**: show a friendly message — "Camera permission denied. Please allow camera access in your browser settings." with a retry button
- [ ] If device has no camera: show "No camera found. Please use a device with a camera." message
- [ ] Scan box should have a visual scanning animation (moving line) while active

### Files

- `scanner.tsx`

---

## 13. Owner Page — Established Year Fix

**Goal:** Update the hardcoded "Established" year to 2025.

- [ ] In `owner.tsx`, find the established year text and change it to `2025`
- [ ] Ideally, pull this from `admin.settings` / restaurant config so it's dynamic

---

## 14. Homepage — Remove Live Kitchen Tracking

**Goal:** Remove the "Live Kitchen Tracking" component from the homepage.

- [ ] In `index.tsx`, locate and remove the `<LiveKitchenTracking />` component and its import
- [ ] Remove any related hooks/state/fetchers that were only used by that component
- [ ] Ensure the page layout still looks balanced after removal

---

## 15. Product Rating by Users

**Goal:** Allow users who ordered an item to rate it after their order is served/completed.

### Flow

```
Order marked SERVED/COMPLETED
  → Customer receives "Rate your order" prompt (on /order/:orderId)
  → Per-item star rating (1–5) + optional comment
  → Submitted rating is saved to DB
  → Rating aggregated and displayed on menu items
```

### Checklist

- [ ] `Rating` model in Prisma:
  ```prisma
  model Rating {
    id         String   @id @default(cuid())
    orderId    String
    menuItemId String
    userId     String?  // nullable for guest orders
    phone      String   // used to associate guest ratings
    stars      Int      // 1–5
    comment    String?
    createdAt  DateTime @default(now())
  }
  ```
- [ ] `POST /ratings` endpoint (authenticated or phone-verified)
- [ ] Rating prompt shown on `/order/:orderId` when status is `SERVED` or `COMPLETED`
- [ ] User can only rate once per item per order (unique constraint)
- [ ] Ratings displayed on menu cards (average stars + count)
- [ ] Admin can view/moderate ratings in dashboard

---

## 16. Footer — Remove Stray "pp"/"app" Text

**Goal:** Remove the stray `pp` or `app` letters visible at the bottom of the footer.

- [ ] In `__root.tsx` footer section, search for any orphaned `app`, `pp`, or similar text nodes
- [ ] Likely a typo from a partially-deleted word (e.g., `App` → leftover `pp`) in a copyright line
- [ ] Clean up the surrounding JSX to ensure the footer copyright line reads correctly

---

## 17. Homepage Ratings — Real Backend Data

**Goal:** The ratings/reviews section on the homepage should fetch real data from the backend (Google Maps sourced, cached).

### Approach

- [ ] Create a backend endpoint `GET /ratings/google` that:
  - Fetches Google Maps Place Reviews via the Google Places API
  - Caches the response in Redis (TTL: 1 hour) to avoid repeated API calls
  - Returns `{ rating: number, reviewCount: number, reviews: Review[] }`
- [ ] Homepage (`index.tsx`) fetches from this endpoint (via TanStack loader)
- [ ] Show real average rating (e.g., ⭐ 4.7), review count, and sample review cards
- [ ] Graceful fallback: if API fails, show cached data; if no cache, show skeleton placeholder

### Config required

- `GOOGLE_PLACES_API_KEY` in backend `.env`
- `GOOGLE_PLACE_ID` for the restaurant's Google Maps listing

---

## 18. Status Indicator Dots

**Goal:** Add real-time service health indicators in the footer, near the "All Rights Reserved" text.

### Design

```
● ● All rights reserved © 2025 Shivansi ● ●
↑ ↑                                       ↑ ↑
Red/Green (frontend online/offline)       Blue/Orange (backend services up/down)
```

### Left side (red/green dot)

- **Green** = current tab/user is connected to the internet
- **Red** = user is offline
- Detect with `navigator.onLine` + `online`/`offline` event listeners
- Add subtle pulsing animation on green dot

### Right side (blue/orange dot)

- **Blue** = backend API is reachable (`GET /health` returns 200)
- **Orange** = backend API is unreachable or returning errors
- Poll `GET /api/health` every 30 seconds
- Animate dot with a "ping" ripple effect

### Checklist

- [ ] Add two indicator dots in `__root.tsx` footer, flanking the copyright text
- [ ] Left dot: green/red based on `navigator.onLine`
- [ ] Right dot: blue/orange based on backend health ping
- [ ] Both dots have a CSS `ping` animation (like Tailwind's `animate-ping` — replicate in vanilla CSS)
- [ ] Tooltip on hover: "Online" / "Offline" / "Services OK" / "Services degraded"
- [ ] Backend: `GET /health` endpoint returning `{ status: "ok", timestamp: "..." }`

---

## 19. Homepage — QR Scan CTA in Ratings Section

**Goal:** Remove the standalone "Scan the QR on your table" banner from its current position on the homepage and re-home it inside (or directly adjacent to) the homepage Ratings section as a styled, interactive button with a QR icon that routes the user to the QR scanner page.

### Current State

- The "Scan the QR on your table" component exists as a separate section on the homepage (`index.tsx`)
- The Ratings section sits independently nearby
- There is no direct CTA linking homepage visitors to the `/scanner` route

### New Design

```
[ Homepage Ratings Section ]
  ┌─────────────────────────────────────────┐
  │  ⭐ 4.7 · 200+ reviews  (real data)     │
  │  [ Review cards carousel ]              │
  │                                         │
  │  ┌─────────────────────────────────┐   │
  │  │  📷 [QR icon]  Scan QR at your  │   │  ← new CTA block
  │  │      table to order now →       │   │
  │  └─────────────────────────────────┘   │
  └─────────────────────────────────────────┘
```

### Behaviour

- The CTA block is **clickable** (button or `<Link>`) — navigates to `/scanner`
- Displays a **QR code icon** (e.g., `lucide-react`'s `QrCode` icon or an inline SVG) on the left
- Text: **"Scan the QR at your table to order"** with a subtle arrow or chevron
- On hover: slight scale-up + glow/border highlight animation
- On mobile: full-width; on desktop: card-width, centered below the reviews

### Checklist

- [ ] Remove the standalone "Scan QR" banner/component from its current location in `index.tsx`
- [ ] Remove any import or wrapper that was exclusively used for that standalone component
- [ ] Add a new CTA block **inside the Ratings section** in `index.tsx` (below review cards)
- [ ] CTA uses `<Link to="/scanner">` (TanStack Router) for navigation
- [ ] Include a QR code icon — use `QrCode` from `lucide-react` or equivalent
- [ ] Style the CTA as a pill/card button consistent with the site's design language (gradient border, subtle glass effect)
- [ ] Add hover animation: `transform: scale(1.02)` + glow
- [ ] Ensure the CTA is accessible: `role="button"`, `aria-label="Scan QR code to place your order"`
- [ ] Test on mobile — CTA must be finger-friendly (min height 48px)

### Files

- `frontend/src/routes/index.tsx` — remove standalone component, add CTA inside ratings section

---

## Summary Table

| # | Feature | Area | Priority | Complexity |
|:---:|:---|:---:|:---:|:---:|
| 1 | QR Order Flow Verification | Full-stack | 🔴 High | Medium |
| 2 | Admin Approval & Kitchen Status | Full-stack | 🔴 High | High |
| 3 | Bill Generation & Storage | Full-stack | 🔴 High | Medium |
| 4 | Loyalty Program | Full-stack | 🟠 Medium | High |
| 5 | Coupon Functionality | Full-stack | 🟠 Medium | Medium |
| 6 | SuperAdmin → Admin Promotion | Full-stack | 🟠 Medium | Medium |
| 7 | Placeholder Cleanup | Frontend | 🟡 Low | Low |
| 8 | Toast Fixes & Enhancements | Frontend | 🔴 High | Medium |
| 9 | Navbar Profile Item | Frontend | 🟠 Medium | Low |
| 10 | Menu Category Filters + Enum | Full-stack | 🟠 Medium | Medium |
| 11 | Footer Clickable Phone | Frontend | 🟡 Low | Low |
| 12 | QR Scanner Camera UX | Frontend | 🟠 Medium | Medium |
| 13 | Owner Page Year Fix | Frontend | 🟡 Low | Low |
| 14 | Remove Live Kitchen Tracking | Frontend | 🟡 Low | Low |
| 15 | Product Rating by Users | Full-stack | 🟠 Medium | High |
| 16 | Footer "pp"/"app" Cleanup | Frontend | 🟡 Low | Low |
| 17 | Homepage Real Ratings | Full-stack | 🟠 Medium | Medium |
| 18 | Status Indicator Dots | Full-stack | 🟠 Medium | Medium |
| 19 | Homepage QR Scan CTA in Ratings Section | Frontend | 🟠 Medium | Low |

---

## Implementation Order (Recommended)

### Phase 1 — Critical Fixes (do first)
1. Toast fixes (#8) — unblocks all user-facing error flows
2. QR Order Flow verification (#1) — core business flow
3. Placeholder cleanup (#7) — quick win, improves UX immediately
4. Footer cleanup (#16, #11) — trivial fixes

### Phase 2 — Core Features
5. Admin Approval & Kitchen Status (#2)
6. Bill Generation (#3)
7. Loyalty Program (#4)
8. SuperAdmin → Admin Promotion (#6)

### Phase 3 — UX & Polish
9. Navbar Profile Item (#9)
10. Menu Category Filters + Backend Enum (#10)
11. QR Scanner Camera UX (#12)
12. Product Rating (#15)
13. Owner page year fix (#13)
14. Remove Live Kitchen Tracking (#14)
15. Homepage QR Scan CTA in Ratings Section (#19)

### Phase 4 — Data & Integrations
15. Homepage Real Ratings from backend (#17)
16. Status Indicator Dots (#18)
17. Coupon check (#5)

---

## 20. Backend Audit — Proper Functions & Data Transfer

**Goal:** Audit all backend routes, controllers, and services to ensure they perform correct business logic, return well-shaped payloads, and handle errors consistently.

### Scope

All routes registered under `src/routes/v1/` including:
- `authRoutes.ts` — login, refresh, logout, passkey, WhatsApp OTP
- `userRoutes.ts` — CRUD, role management
- `dataRoutes.ts` — menu, orders, coupons, settings, reviews, loyalty
- `health.ts` / `ping.ts` — liveness checks

### Audit Checklist

#### Auth & Sessions
- [ ] `POST /auth/login` (email+password) returns `{ user, accessToken }` and sets `refreshToken` cookie correctly
- [ ] `POST /auth/refresh` rotates refresh token and issues a new access token
- [ ] `POST /auth/logout` clears both cookies and invalidates refresh token in DB
- [ ] `POST /auth/whatsapp/send-otp` sends OTP via WhatsApp API and stores `PhoneVerification` record
- [ ] `POST /auth/whatsapp/verify-otp` validates code hash, marks `used: true`, creates/finds `Customer` record, and returns session
- [ ] Passkey registration and authentication endpoints function correctly end-to-end
- [ ] `currentChallenge` is cleared after passkey auth completes

#### Users & Roles
- [ ] `GET /users` (admin+) returns paginated user list with roles — no password/hash leak
- [ ] `PATCH /users/:id/role` is gated to `SUPERADMIN` only; logs to `AuditLog`
- [ ] `DELETE /users/:id` is gated to `SUPERADMIN`; cascades passkeys and audit logs correctly
- [ ] Password is **never** returned in any API response (`hashed_password` excluded in all selects)

#### Menu / Products
- [ ] `GET /menu` returns products with category, `offer_price`, availability, and correct shape
- [ ] `GET /menu?category=SWEETS` filters correctly (once enum added — see #10)
- [ ] `POST /menu` (admin) validates required fields: `name`, `price`, `category_id`
- [ ] `PATCH /menu/:id` only updates provided fields (partial update / PATCH semantics)
- [ ] `DELETE /menu/:id` sets `is_available: false` (soft delete) or hard deletes — decide and document

#### Orders
- [ ] `POST /orders` creates Order + OrderItems in a single transaction; rolls back on any failure
- [ ] `order_number` is unique and human-readable (e.g., `ORD-20260828-0042`)
- [ ] `session_token` is generated server-side (UUID v4), never accepted from client
- [ ] `GET /orders/:orderId?t=<session_token>` validates token before returning order data
- [ ] `PATCH /orders/:orderId/status` (admin) validates status transitions (no skipping states)
- [ ] WhatsApp notification is triggered inside `POST /orders` (not fire-and-forget blocking — use async)
- [ ] Order total is **recalculated server-side** from item prices — never trusted from client payload

#### Discounts / Coupons / Offers
- [ ] `POST /discounts/validate` checks: coupon exists, is active, not expired, min order met, not exceeded usage
- [ ] On order completion, `usage_count` is incremented for the used discount
- [ ] `Offer` banners are returned separately from `Discount` logic (display vs. discount are separate concerns)

#### Loyalty
- [ ] On order `COMPLETED`, `Customer.visits` is incremented
- [ ] After increment, backend checks `LoyaltyRule` table for matching `visits_required`
- [ ] If match found, discount is recorded on the next order (or returned as a voucher)
- [ ] `GET /loyalty/status?phone=...` returns current visit count and next milestone

#### Settings
- [ ] `GET /settings` is public (no auth) — returns safe fields only (no `upi_id`, no `whatsapp_token`)
- [ ] `PATCH /settings` is admin-only; validates fields
- [ ] `AppConfig` (WhatsApp token, owner email) is separate from `RestaurantSettings` and **never** returned to public endpoints

#### Reviews & Ratings
- [ ] `POST /reviews` accepts `product_id`, `customer_name`, `rating`, `comment`; sets `is_published: false` by default
- [ ] Admin can approve/reject reviews via `PATCH /reviews/:id`
- [ ] `GET /reviews?product_id=...` returns only `is_published: true` reviews

#### Health
- [ ] `GET /health` returns `{ status: "ok", timestamp, uptime, db: "connected" }`
- [ ] `GET /ping` returns `{ pong: true }`
- [ ] Health endpoint checks DB connectivity (light query, e.g., `prisma.$queryRaw\`SELECT 1\``)

#### Cross-cutting concerns
- [ ] All error responses follow a consistent shape: `{ error: string, code?: string, details?: any }`
- [ ] HTTP status codes are semantically correct (200, 201, 400, 401, 403, 404, 409, 500)
- [ ] Input validation (Zod schemas) on all POST/PATCH routes; return 400 with field-level errors
- [ ] `AuditLog` entries are written for: login, logout, role change, order status change, settings update
- [ ] Sensitive fields (`hashed_password`, `refreshToken`, `totpSecret`, `code_hash`, `whatsapp_token`) are **excluded** from all responses via Prisma `select` or `omit`
- [ ] Rate limiting applied to OTP endpoints (`/auth/whatsapp/send-otp` max 3 req/min per phone)
- [ ] CORS configured to allow only the frontend origin in production

### Files to Audit

- `src/routes/v1/*.ts`
- `src/controllers/*.ts`
- `src/services/*.ts`
- `src/routeSchemas/*.ts` (Zod validation)
- `src/middlewares/*.ts` (auth guards, error handler)

---

## 21. Seed Script — Mock Data for Testing

**Goal:** Create a comprehensive Prisma seed script (`prisma/seed.ts`) that populates the database with realistic mock data covering all major models, so the app is immediately testable end-to-end.

### Seed file location

```
backend/prisma/seed.ts
```

Add to `backend/package.json`:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

Run with: `npx prisma db seed`

### Data to seed

#### Users (3 total)

| Name | Email | Role | Notes |
|:---|:---|:---:|:---|
| Super Admin | superadmin@shivansi.in | SUPERADMIN | hashed password: `Admin@123` |
| Riya Sharma | riya@shivansi.in | ADMIN | Kitchen manager |
| Aman Verma | aman@shivansi.in | ADMIN | Floor manager |

#### Restaurant Settings (1 row)

```ts
{
  name: "Shivansi Restaurant",
  tagline: "Authentic Flavours of Ranchi",
  address: "Main Road, Ranchi, Jharkhand - 834001",
  phone: "+919876543210",
  gst_number: "20ABCDE1234F1ZX",
  opening_time: "10:00",
  closing_time: "22:30",
  upi_id: "shivansi@upi",
  tax_percent: 5,
  packing_charge: 20,
  currency: "INR",
}
```

#### AppConfig (1 row)

```ts
{
  owner_email: "superadmin@shivansi.in",
  whatsapp_token: "PLACEHOLDER_TOKEN",
  whatsapp_phone_number_id: "PLACEHOLDER_PHONE_ID",
}
```

#### Categories (6 rows matching ProductCategory enum)

| Name | Slug | Sort Order |
|:---|:---|:---:|
| South Indian | south-indian | 1 |
| Sweets | sweets | 2 |
| Snacks | snacks | 3 |
| Drinks | drinks | 4 |
| Ice Creams | ice-creams | 5 |
| Desserts | desserts | 6 |

#### Products (12 items — 2 per category)

| Name | Category | Price | Offer Price | Veg | Spicy | Special |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| Masala Dosa | South Indian | ₹120 | ₹99 | ✅ | ✅ | ✅ |
| Idli Sambhar | South Indian | ₹80 | — | ✅ | ❌ | ❌ |
| Gulab Jamun | Sweets | ₹60 | ₹49 | ✅ | ❌ | ✅ |
| Rasgulla | Sweets | ₹70 | — | ✅ | ❌ | ❌ |
| Samosa (2pc) | Snacks | ₹40 | ₹30 | ✅ | ✅ | ❌ |
| Paneer Tikka | Snacks | ₹180 | ₹150 | ✅ | ✅ | ✅ |
| Mango Lassi | Drinks | ₹90 | ₹75 | ✅ | ❌ | ✅ |
| Masala Chai | Drinks | ₹30 | — | ✅ | ❌ | ❌ |
| Vanilla Scoop | Ice Creams | ₹80 | ₹60 | ✅ | ❌ | ❌ |
| Chocolate Sundae | Ice Creams | ₹120 | ₹99 | ✅ | ❌ | ✅ |
| Malpua | Desserts | ₹100 | ₹80 | ✅ | ❌ | ✅ |
| Kheer | Desserts | ₹70 | — | ✅ | ❌ | ❌ |

#### Restaurant Tables (6 tables)

| Table # | Seats |
|:---:|:---:|
| 1 | 2 |
| 2 | 4 |
| 3 | 4 |
| 4 | 6 |
| 5 | 6 |
| 6 | 8 |

#### Offers (2 rows)

```ts
[
  {
    title: "Weekend Special",
    description: "20% off on all South Indian items every weekend",
    discount_percent: 20,
    coupon_code: null,
    is_active: true,
    starts_at: /* next Saturday */,
    ends_at: /* next Sunday */,
  },
  {
    title: "Welcome Offer",
    description: "Flat 10% off on your first order",
    discount_percent: 10,
    coupon_code: "WELCOME10",
    is_active: true,
    ends_at: /* 30 days from now */,
  }
]
```

#### Discounts / Coupons (3 rows)

| Coupon Code | Type | Value | Min Order | Max Discount | Expiry |
|:---|:---:|:---:|:---:|:---:|:---:|
| `FLAT50` | flat | ₹50 | ₹299 | ₹50 | 30 days |
| `SAVE15` | percent | 15% | ₹199 | ₹100 | 30 days |
| `FREEDRINK` | flat | ₹30 | ₹150 | ₹30 | 15 days |

#### Loyalty Rules (4 rows — matching the loyalty program tiers)

| Visits Required | Discount % | Reward Points | Expiry Days |
|:---:|:---:|:---:|:---:|
| 25 | 5 | 50 | 30 |
| 50 | 10 | 100 | 30 |
| 75 | 15 | 150 | 30 |
| 100 | 20 | 200 | 60 |

#### Customers (3 rows)

| Name | Phone | Visits | Reward Points | Total Spend |
|:---|:---|:---:|:---:|:---:|
| Priya Singh | +919811111111 | 24 | 240 | ₹4,800 |
| Rahul Gupta | +919822222222 | 50 | 500 | ₹10,000 |
| Anjali Das | +919833333333 | 3 | 30 | ₹600 |

#### Orders (3 sample orders in various statuses)

| Order # | Table | Customer | Status | Payment | Total |
|:---|:---:|:---|:---:|:---:|:---:|
| ORD-TEST-001 | 2 | Priya Singh | SERVING | COD | ₹319 |
| ORD-TEST-002 | 4 | Rahul Gupta | COMPLETED | PREPAID | ₹540 |
| ORD-TEST-003 | 1 | Anjali Das | PENDING | COD | ₹120 |

#### Reviews (4 published, 1 pending moderation)

```ts
[
  { product: "Masala Dosa", rating: 5, comment: "Crispy and perfect!", is_published: true },
  { product: "Gulab Jamun", rating: 4, comment: "Soft and sweet, loved it.", is_published: true },
  { product: "Mango Lassi", rating: 5, comment: "Best lassi in Ranchi!", is_published: true },
  { product: "Paneer Tikka", rating: 4, comment: "Perfectly spiced.", is_published: true },
  { product: "Samosa", rating: 2, comment: "Was cold when served.", is_published: false }, // pending
]
```

#### Inventory Items (4 rows)

| Item | Unit | Qty | Low Stock Threshold | Cost/Unit |
|:---|:---:|:---:|:---:|:---:|
| Rice | kg | 50 | 10 | ₹45 |
| Milk | litre | 20 | 5 | ₹60 |
| Paneer | kg | 8 | 2 | ₹350 |
| Maida | kg | 30 | 5 | ₹40 |

### Checklist

- [ ] Create `backend/prisma/seed.ts` with all above data
- [ ] Use `bcrypt.hash("Admin@123", 10)` for user passwords (never plain text)
- [ ] Use `upsert` with `where` clause so seed is idempotent (safe to re-run)
- [ ] Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` to `backend/package.json`
- [ ] Add `ts-node` as a dev dependency if not already present
- [ ] Document seed credentials in `backend/prisma/SEED_CREDENTIALS.md` (gitignored from production)
- [ ] Verify seed runs clean: `npx prisma db seed` — no errors, all rows inserted
- [ ] Add a `--reset` flag option to `seed.ts` that truncates all tables before re-seeding (dev only)

### Seed Credentials Reference (for dev/testing)

> ⚠️ **Never use these credentials in production.**

| Role | Email | Password |
|:---:|:---|:---:|
| SUPERADMIN | superadmin@shivansi.in | `Admin@123` |
| ADMIN | riya@shivansi.in | `Admin@123` |
| ADMIN | aman@shivansi.in | `Admin@123` |

---

## Summary Table

| # | Feature | Area | Priority | Complexity |
|:---:|:---|:---:|:---:|:---:|
| 1 | QR Order Flow Verification | Full-stack | 🔴 High | Medium |
| 2 | Admin Approval & Kitchen Status | Full-stack | 🔴 High | High |
| 3 | Bill Generation & Storage | Full-stack | 🔴 High | Medium |
| 4 | Loyalty Program | Full-stack | 🟠 Medium | High |
| 5 | Coupon Functionality | Full-stack | 🟠 Medium | Medium |
| 6 | SuperAdmin → Admin Promotion | Full-stack | 🟠 Medium | Medium |
| 7 | Placeholder Cleanup | Frontend | 🟡 Low | Low |
| 8 | Toast Fixes & Enhancements | Frontend | 🔴 High | Medium |
| 9 | Navbar Profile Item | Frontend | 🟠 Medium | Low |
| 10 | Menu Category Filters + Enum | Full-stack | 🟠 Medium | Medium |
| 11 | Footer Clickable Phone | Frontend | 🟡 Low | Low |
| 12 | QR Scanner Camera UX | Frontend | 🟠 Medium | Medium |
| 13 | Owner Page Year Fix | Frontend | 🟡 Low | Low |
| 14 | Remove Live Kitchen Tracking | Frontend | 🟡 Low | Low |
| 15 | Product Rating by Users | Full-stack | 🟠 Medium | High |
| 16 | Footer "pp"/"app" Cleanup | Frontend | 🟡 Low | Low |
| 17 | Homepage Real Ratings | Full-stack | 🟠 Medium | Medium |
| 18 | Status Indicator Dots | Full-stack | 🟠 Medium | Medium |
| 19 | Homepage QR Scan CTA in Ratings Section | Frontend | 🟠 Medium | Low |
| 20 | Backend Audit — Proper Functions & Data Transfer | Full-stack | 🔴 High | High |
| 21 | Seed Script — Mock Data for Testing | Full-stack | 🔴 High | Medium |

---

## Implementation Order (Recommended)

### Phase 0 — Foundation (do before anything else)
1. Seed script (#21) — populate DB so all features are testable immediately
2. Backend audit (#20) — verify all routes/controllers work correctly before building on top

### Phase 1 — Critical Fixes
3. Toast fixes (#8) — unblocks all user-facing error flows
4. QR Order Flow verification (#1) — core business flow
5. Placeholder cleanup (#7) — quick win, improves UX immediately
6. Footer cleanup (#16, #11) — trivial fixes

### Phase 2 — Core Features
7. Admin Approval & Kitchen Status (#2)
8. Bill Generation (#3)
9. Loyalty Program (#4)
10. SuperAdmin → Admin Promotion (#6)

### Phase 3 — UX & Polish
11. Navbar Profile Item (#9)
12. Menu Category Filters + Backend Enum (#10)
13. QR Scanner Camera UX (#12)
14. Product Rating (#15)
15. Owner page year fix (#13)
16. Remove Live Kitchen Tracking (#14)
17. Homepage QR Scan CTA in Ratings Section (#19)

### Phase 4 — Data & Integrations
18. Homepage Real Ratings from backend (#17)
19. Status Indicator Dots (#18)
20. Coupon check (#5)

---

*This document should be updated as features are implemented. Mark completed items with ✅.*
