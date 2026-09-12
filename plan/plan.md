# Casafeast — Enterprise Chef Portal (Web App)

A web portal where home chefs sign up, complete a multi-step onboarding, get admin-verified, then manage their menus, orders and revenue. Corporate-clean look: white background with Dynamic Blue + Organic Green accents. Split-screen auth (video showcase left, form card right). Footer: "Created by SystemNex Techsolutions LLP. All rights reserved. TM Number: 7810892".

## Decisions locked in (from our chat)
- Full working backend built here (all referenced APIs implemented).
- OTP is **simulated** — a test code is shown on screen and any 6 digits are accepted. No real SMS.
- Google captcha is **stubbed** — no real reCAPTCHA challenge.
- File uploads are **simulated/local** for demo — files show as "uploaded", can be deleted and re-uploaded, but are not stored in real cloud storage.
- All 5 modules built now.
- Web app only (desktop-first, responsive).

## What gets built

### Module 1 — Authentication & Onboarding Gateway
- **Sign-up form**: First Name, Last Name, Email, Mobile Number, (stubbed captcha token).
- **Mobile validation**: on completing the mobile field, checks the number, then shows a 6-digit OTP dialog with a 2-minute countdown and a "Resend OTP" link that unlocks after the timer. Verifying returns the chef's unique ID.
- **Email validation**: on completing the email field, checks the email is valid/active before allowing submission.
- **Returning user login**: single input accepting either phone or email, routed through an OTP verification step.
- **Geofencing after login**: browser asks for location.
  - Allowed: **Visakhapatnam (Vizag)** and **Bangalore** → enter the dashboard.
  - Any other location → full-screen lock: "We are not serving your location at the moment."
  - Assumption: if the user denies location permission, they are treated as a disallowed location (locked out) with a message to enable location.

### Module 2 — Workspace Shell & Side Navigation
- **Top bar**: chef's Full Name, verified Email, Phone; Casafeast logo; notification bell with badge; profile menu with a "clear cache / logout" option.
- **Two navigation states**:
  - **Onboarding mode** (account not yet activated): a non-dismissible welcome popup "Please complete On-boarding to start receiving the orders." Only the "On-Boarding" link works; Orders, Revenue, Menu are greyed out and unclickable.
  - **Activated mode** (admin approved): "On-Boarding" link is hidden/locked; Orders (Today / Upcoming / Completed), Revenue Analytics, and Menu Catalog (Create / Active / Inactive) all unlock.
- **Support ticket box** pinned at the bottom of the sidebar: type an issue and submit without leaving the screen.

### Module 3 — 4-Step Onboarding Wizard + Verification Board
- **Step 1 — Pre-screening & fees**: City, Area (dropdowns), prior experience toggle, FSSAI certificate toggle, and a food-type builder (e.g. Homemade, Bakery) where each type expands to add specific dishes and cuisines. A bold banner states the commission rule: **"Casafeast standard marketplace commission is 20% on each order payout value + 18% GST."** A checkbox accepting the terms is required to continue.
- **Step 2 — Personal profile**: name, phone, email, gender, marital status, family-unit toggle, Aadhaar number, plus a kitchen address sub-form (kitchen name, address 1/2, state, city, pincode) and a KYC document upload area (drag-and-drop, view/delete/re-upload).
- **Step 3 — FSSAI compliance**: license number, license status, expiry date, approved product categories (multi-select), and a PDF upload area with the same add/remove behavior.
- **Step 4 — Bank details**: account holder name, bank name, account number, IFSC, and a passbook proof upload area.
- **After submission**: a verification board shows three tracks — **KYC Verification, Bank Verification, Field Verification** — each flipping to a green checkmark as an admin marks it verified.

### Module 4 — Menu Catalog
- **Create Menu**: name, description, inclusions, "prior hours notice" (default 24), active toggle; dietary checkboxes (Veg, Non-Veg, Jain); meal-slot checkboxes (Breakfast, Lunch, Dinner); a duration/package builder with add/remove rows (each row = plan [Weekly 5-Days / Monthly 20-Days / Quarterly 60-Days] + price + daily volume cap); and an add-ons toggle exposing custom add-on item names + prices.
- **Active & Inactive catalog grids** with a filter bar: debounced text search over name/inclusions, dietary multi-select chips, meal-slot checkboxes, and duration-plan multi-select.
- **Menu cards** show image, name, inclusion tags, all duration price plans, and (if soft-deleted) an expiry timestamp. Each card has: activate/deactivate toggle, edit (modal with pre-filled data, add/edit/delete duration rows), manage add-ons, and delete (soft-delete with confirmation).

### Module 5 — Orders & Revenue
- **Orders board**, three tabs: Today, Upcoming, Completed. Filter row: search across customer name / order ID / meal items; time-slot dropdown (Breakfast/Lunch/Dinner); subscription filter (Weekly/Monthly/Quarterly); delivery-mode toggle (dispatched vs pending).
- **Order cards** show delivery slot, box items, subscription info, with three actions: Accept, Reject (opens a comment box for reason), and Request Delivery Partner (simulated dispatch to logistics — **not** wired to a real Porter/Rapido account).
- **Revenue dashboard**: earnings summary with charts, active subscription pipeline counts, and completion/commission breakdown against the 20% + 18% GST rule.

## Admin verification — how it works in the demo
The spec depends on an "admin" approving accounts and verifying KYC/Bank/Field. To make the flow demonstrable end-to-end, the plan includes a lightweight admin control (a simple admin screen or toggles) to activate an account and mark verification tracks complete, so the chef-side status updates can be seen live. Assumption: this stands in for a full admin system, which is out of scope for this build.

## Things being simulated (not real yet)
- OTP delivery (shown on screen, any 6 digits work).
- Google captcha (stubbed token).
- File storage (uploads are for demo, not persisted to real cloud storage).
- Delivery partner dispatch (Porter/Rapido) — simulated action, no live logistics account.
- Support-ticket webhook — recorded in the system, not sent to an external care tool.

## Open assumptions worth confirming
- Location denial = locked out (treated as disallowed).
- Seed/sample data (a demo chef, sample menus and orders) will be created so every screen has content to show on first load.
- "AI video showcase" on the auth screen will use a placeholder looping video/visual since no specific video asset was provided.
