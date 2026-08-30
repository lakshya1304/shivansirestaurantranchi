# Maa Tara Sweets — Enhancement Roadmap
*(Derived from `enhancement.txt` and aligned with `.context` architecture)*

This document organizes the planned enhancements, bug fixes, and infrastructure tasks into logical categories based on the current modular backend (Fastify + Prisma) and React/TanStack frontend architecture. 

---

## 🐛 Critical Bug Fixes (High Priority)
*These impact core business flows (ordering, payment, auth).*

- [x] **Cart Order Placement**: Fix the `400 Bad Request` on `/api/v1/data/orders/place` for cart orders. *(Note: takeaway parcel orders are currently working, indicating a payload mismatch for dine-in).*
- [x] **My Orders Fetching & Customer Login**: Resolve the issue where "My Orders" fails to fetch even when logged in as admin/superadmin. Fix the fallback to the login screen for normal users using Email/WhatsApp.
- [x] **Coupon Application**: Fix the bug where festive coupons are created successfully but fail to reduce the cart price when applied.
- [x] **Navbar Tagline Glitch**: Fix the top navbar (`site-header.tsx`) where "Best sweets in Ranchi" gets unexpectedly overwritten by "Table X selected". This should remain a static tagline.
- [x] **UPI Details Persistence**: Fix the issue where UPI details get emptied on save. Ensure the UPI QR/ID remains clickable and updates seamlessly on the settings page without full reloads.
- [x] **Passkey UX**: Fix passkey registration visibility. Remove the "Delete Passkeys" button if none exist. Add a "Login with Passkey" option to the standard login forms.
- [x] **Category Image Field**: Remove the image upload requirement for Food Categories, as they only require a name/description.
- [x] **Bill PDF Fix**: Resolve any outstanding formatting or generation issues with the Bill PDF (building on the A4 print CSS added in Phase 4).

---

## 🚀 Features & UX Enhancements (Medium Priority)
*Improvements to the admin dashboard, inventory management, and transparency.*

- [x] **Genuine Review System**: Remove the admin's ability to selectively accept/decline reviews to prevent bias. Automatically display genuine customer reviews.
- [x] **Inventory Item Merging**: Add functionality to merge duplicate inventory items (e.g., "rice" and "Rice") to handle case-sensitivity and typos in product names.
- [x] **Inventory Charts & Alerts**: Add a chart/graph to display product stock levels and weekly supply updates. Visualize the existing item quantities effectively.
- [x] **Dashboard Revenue Analytics**: Update the dashboard to show revenue breakdowns (Today's Revenue, This Month's Revenue, Specific Date Revenue) and display payment categorization (e.g., Cash vs. UPI).
- [x] **Review Aggregation**: Check and update the customer product review aggregation logic to support weekly review calculations.
- [x] **Superadmin Settings Helper**: Add helper notes/tooltips in the superadmin settings page to guide users on how to obtain API keys (WhatsApp, etc.) and where to find the relevant links.
- [x] **UI Component Notes**: Add documentation or tooltips explaining the "Product Toggle" usage directly within the UI components.

---

## 🔌 Integrations & Third-Party
*Connecting external services for communication and auth.*

- [ ] **WhatsApp Login & Config**: Fully setup and configure WhatsApp login (building on the OTP `phone_verifications` table).
- [ ] **Email API**: Integrate Brevo for transactional emails (order confirmations, password resets).
- [ ] **Google OAuth**: Complete and verify Google OAuth setup for email login.

---

## ⚡ Performance & Infrastructure
*Optimizing speed, SEO, and deployment.*

- [x] **Latency Optimization**: Address the latency issues in both frontend and backend. Specifically, improve the response time for order status updates ("live order pending..." state changes).
- [x] **Real-time Order Updates**: Investigate why order updates take a long time to reflect on dashboards and occasionally fail. *(Consider optimizing React Query polling or moving to Server-Sent Events/WebSockets).*
- [x] **Hosting Migration**: Evaluate a backend hosting change to improve latency and reliability.
- [x] **SEO**: Implement Search Engine Optimization best practices across the frontend routes.
- [ ] **Branding**: Update and apply the official Logo across the app.

---

## 📚 Security & Governance Documentation
- [x] **Superadmin Governance (`superadminimplementation.md`)**: Create a proposal for superadmin account management. Address the risk of a compromised superadmin account by proposing a consensus/multi-sig model (e.g., deleting/editing a superadmin requires approval from other superadmins).
