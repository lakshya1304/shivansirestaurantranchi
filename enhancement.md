# 🍽️ Maa Tara Sweets Restaurant — Phase 4 Enhancement Roadmap

> **Document Version:** 2.0  
> **Updated:** 2026-08-29  
> **Scope:** Full-stack (Frontend: TanStack Start/TSX · Backend: Node + Prisma)

---

## Overview

Following the successful implementation of Phases 1-3, **Phase 4** focuses on robust database restructuring, a native loyalty program, and a modern image processing pipeline. The core objective is to distinctly separate Administrative operations from Customer operations and move all file storage to Supabase.

---

## 1. Database Architecture & Model Restructuring

**Goal:** Strictly separate Customer data from Admin/SuperAdmin data to streamline billing, tracking, and security.

### 1.1 Consolidation of the "User" Model

- **"User" becomes "Customer" exclusively:** The `User` database will now only store customer data.
- **Mandatory Phone Numbers:** There will be **no guest checkout**. All orders must be tied to a valid phone number to ensure genuineness and to accurately track loyalty visits.
- **Merge `Customer` fields into `User`:**
  - Drop the separate `Customer` model entirely.
  - Move `visits`, `total_spend`, `reward_points`, `favourite_item`, and `last_visit` directly into the `User` model.

### 1.2 Isolation of the "Admin" Model

- **New `Admin` Model:** Create a dedicated table (`Admin` or `AdminProfile`) exclusively for staff, admins, and superadmins.
- **Separate Authentication:** Admin authentication and audit logs will reference the `Admin` model rather than the `User` model.

### 1.3 Direct Bill & Order Tracking

- **Order Relations:** Ensure the `Order` model links directly to the `User` model (via `userId`).
- **Bill Generation:** All generated bills (`bill_id`) will be tracked and permanently associated within the `User` DB structure.

---

## 2. Milestone Loyalty Program

**Goal:** Reward genuine returning users automatically at specific visit milestones to encourage retention.

### 2.1 The Rules

- Customers receive a discount exactly on their **25th, 50th, 75th, and 100th** visits.
- Because phone numbers are mandatory for every order, visit tracking (`User.visits`) will always be accurate.
- The discount applies automatically to the bill on the milestone visit.

### 2.2 Implementation Details

- **Checkout Logic:** Upon order placement/completion, check if `User.visits + 1` matches a milestone.
- **Discount Application:** Apply the respective percentage discount to the `Order` and clearly display the "Milestone Loyalty Reward" on the generated bill.
- **Visit Increment:** Reliably increment the `visits` counter upon successful payment/completion.

---

## 3. Supabase Image Pipeline & Optimization

**Goal:** Replace external image hosting (ImgBB) with a controlled, optimized Supabase Storage pipeline for product and category images.

### 3.1 The Pipeline Architecture

- **Upload via Multer:** Admin routes for adding/editing products will use `multer` to handle `multipart/form-data` image uploads in-memory.
- **Compression via Sharp:** Uploaded images will be passed through `sharp` to resize them appropriately and convert them to optimized formats (e.g., WebP) to ensure fast frontend load times.
- **Storage in Supabase:** The optimized image buffer will be uploaded directly to a Supabase Storage bucket using the backend's existing Supabase URL and API keys.

### 3.2 Automated Resource Cleanup

- **Deletion Hook:** When an admin deletes a product (or updates a product's image), the backend will automatically call the Supabase API (`supabase.storage.from('bucket').remove(['path'])`) to delete the old image.
- **Orphan Prevention:** This ensures no unused images consume storage space over time.

---

## 4. Admin Live Orders Dashboard — Bug Fixes & Status Workflow

**Goal:** Fix the table number display bug and implement the full order status update lifecycle in the admin live dashboard.

### 4.1 Bug: Table Number Always Shows "Table 1"

- **Root Cause:** The admin dashboard is likely hardcoding or defaulting `table_number` to `1` when rendering order cards, rather than reading the value from the Order's actual `table_number` field.
- **Fix:** Ensure the order card component reads `order.table_number` (or `order.table_number ?? "Takeaway"`) directly from the API response, not from local state or a default prop.

### 4.2 Full Order Status Lifecycle

- **Problem:** Currently the admin only has two actions — "Mark Paid" and "Print Bill". There are no status-update controls for the kitchen/service workflow.
- **Required Status Flow:**

  ```
  PENDING
    → Waiting for Confirmation (admin action)
    → Order Accepted (admin clicks "Accept")
    → Preparing (kitchen updates)
    → Food Ready (kitchen clicks "Ready")
    → Served at Table (staff clicks "Served")
    → Completed (auto or manual)
  ```

- **Implementation Details:**
  - Each order card in the live dashboard must display the **current status** prominently as a badge.
  - Add a **single context-aware action button** per order that advances to the next status. Example: if status is `PENDING` → button says "Accept Order"; if `CONFIRMED` → "Mark Preparing"; if `PREPARING` → "Mark Ready", etc.
  - The backend route `PATCH /orders/:id/status` should accept the new `status` value and update the DB.
  - Optionally trigger a WhatsApp notification to the customer when the order moves to `SERVING` status ("Your order is ready to be served!").

### Checklist — Section 4

- [ ] Fix `order.table_number` rendering in the admin order card component (stop defaulting to 1).
- [ ] Add status badge to each order card showing current status with colour coding (PENDING=yellow, CONFIRMED=blue, PREPARING=orange, READY=green, SERVED=teal, COMPLETED=grey).
- [ ] Add context-aware single "Next Step" action button per order that advances status through the lifecycle.
- [ ] Verify `PATCH /orders/:id/status` backend route exists and correctly validates status transitions.
- [ ] Optional: WhatsApp notification to customer on `PREPARED` status change.

---

## 5. Bill Generation — Concise Product-Only Format

**Goal:** The generated bill is currently too verbose (spans ~3 pages). Replace it with a clean, concise, print-friendly single-page bill containing only the essential product/order information.

### 5.1 Remove from the Bill

- No "update" buttons or interactive elements inside the bill view/print.
- Remove lengthy restaurant info blocks repeated multiple times.
- Remove any placeholder sections, terms & conditions walls, or padding.

### 5.2 Concise Bill Format

```
──────────────────────────────────
🍭 Maa Tara Sweets
Bill No: BILL-20260829-0042  |  Table: 7
Date: 29 Aug 2026  12:45 PM
──────────────────────────────────
ITEM               QTY   PRICE
Kaju Katli         2     ₹180
Motichoor Ladoo    1     ₹80
──────────────────────────────────
Subtotal:          ₹260
Loyalty Discount:  -₹13 (5%)
GST (5%):          ₹12.35
TOTAL:             ₹259.35
──────────────────────────────────
Payment: COD    Customer: +91XXXXX
Thank you! Visit again. 🙏
```

- The bill should be a **read-only, print-friendly** page, not an editable form.
- A single "Print / Download PDF" button at the top, outside the printable area.

### Checklist — Section 5

- [ ] Strip the bill component down to only: header (shop name, bill ID, table, date), item table (name, qty, price, line total), and summary (subtotal, discount, tax, total, payment mode).
- [ ] Remove all edit/update form elements from the bill view.
- [ ] Ensure the bill fits on a single printed page (A4 or 80mm receipt).
- [ ] Add a print button that triggers `window.print()` with correct `@media print` CSS to hide nav/footer.

---

## 6. Homepage Reviews — Real Customer Reviews

**Goal:** The homepage review/testimonial component currently shows hardcoded dummy data. Replace it with real reviews submitted by actual customers via the backend.

### 6.1 Backend

- Expose a public endpoint `GET /reviews?published=true&limit=6` that returns the latest published reviews ordered by recency.
- Each review should include: `customer_name`, `rating`, `comment`, `created_at`, and optionally `product_id` (linked item name).

### 6.2 Frontend

- Replace the static/hardcoded `reviewData` array in the homepage reviews component with a `useQuery` (React Query) call to `GET /reviews?published=true&limit=6`.
- Show a loading skeleton while fetching.
- Gracefully fall back to a "No reviews yet" message if the array is empty.

### Checklist — Section 6

- [ ] Verify `GET /reviews` endpoint exists in `dataRoutes.ts` and supports `published=true` filtering + limit.
- [ ] Replace hardcoded homepage reviews array with an API call using `useQuery`.
- [ ] Add loading skeletons matching the current card design.
- [ ] Ensure admin can publish/unpublish reviews from the admin dashboard.
- [ ] Seed at least 3 genuine-looking published reviews in `seed.ts` for local testing.

---

## Execution Checklist

### Phase 4A: Schema & Migrations

- [ ] Update `schema.prisma`: Create `Admin`, update `User` with Customer fields, update `Order` relation.
- [ ] Run `prisma migrate dev` and ensure existing seed data is adapted.

### Phase 4B: Authentication & Logic Shift

- [ ] Update `authService.ts` to route admin logins to the `Admin` model and customer logins to the `User` model.
- [ ] Update checkout flow to enforce phone numbers and associate orders directly with the `User` model.

### Phase 4C: Loyalty Milestones

- [ ] Implement milestone check (25, 50, 75, 100) in the order placement controller.
- [ ] Apply percentage discounts and test bill generation.

### Phase 4D: Image Pipeline

- [ ] Install `multer` and `sharp`.
- [ ] Setup `@supabase/supabase-js` client using existing `.env` credentials.
- [ ] Create an `uploadImage` utility that chains Multer → Sharp → Supabase.
- [ ] Integrate the upload and delete utility into the Admin Product routes.

### Phase 4E: Admin Order Dashboard Fixes

- [ ] Fix table number display bug in order cards.
- [ ] Implement full status lifecycle (PENDING → CONFIRMED → PREPARING → PREPARED → SERVED → COMPLETED) with context-aware buttons.

### Phase 4F: Concise Bill

- [ ] Rebuild bill component as read-only, single-page, print-friendly format.
- [ ] Add print/PDF button with `@media print` CSS.

### Phase 4G: Real Reviews on Homepage

- [ ] Wire homepage review component to `GET /reviews?published=true` API.
- [ ] Ensure published/unpublish flow works from admin panel.
