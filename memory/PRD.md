# Casafeast — Enterprise Chef Portal (PRD)

## Original Problem Statement
Enterprise Chef Portal frontend + backend for home chefs: split-screen auth (video showcase + form), geofenced onboarding (Vizag & Bangalore only), state-driven workspace shell, 4-step onboarding wizard with verification board, menu catalog, orders kanban and revenue analytics. Brand: white canvas + Dynamic Blue (#1D4ED8) + Organic Green (#15803D). Footer: "Created by SystemNex Techsolutions LLP. All rights reserved. TM Number: 7810892".

## Architecture
- Backend: FastAPI + MongoDB (motor), all routes under /api. Single server.py.
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui + framer-motion + recharts.
- Auth: simulated OTP (any 6 digits, demo code shown), stubbed captcha, session token in localStorage.
- API client: axios interceptor adds bearer token + payload-hash + secure-transit headers; local GET cache layer.

## User Personas
- Home Chef: signs up, onboards, manages menus/orders/revenue.
- Admin (demo): verifies KYC/Bank/Field and activates chefs at /admin.

## Core Requirements (static)
1. Split-screen auth with OTP dialog + returning-user login.
2. Geofence gating to Visakhapatnam & Bangalore; lock screen otherwise.
3. State-driven sidebar (onboarding mode vs activated mode) + support ticket.
4. 4-step onboarding wizard + live verification board.
5. Menu catalog: create + active/inactive grids with filters + card actions.
6. Orders kanban (Today/Upcoming/Completed) + revenue analytics with charts.

## Implemented (2026-06)
- All 5 modules built and tested end-to-end (iteration 1: 21/21 backend, frontend 100%).
- Iteration 2 (29/29 backend, frontend 100%): real object-storage uploads, auto-play showcase, delivery dispatch layer + tracking, payout PDF+CSV.
- Iteration 3 (38/38 backend, frontend 100%):
  - Menu photo GALLERY — multi-upload per menu with a selectable COVER (Create + Edit); cover shown on cards.
  - Payout HISTORY — /payout/{uuid}/history returns 6 months; each re-downloadable as PDF/CSV (month-scaled figures).
  - Delivery NOTIFICATIONS — request-delivery + status advances push in-app notifications; TopBar bell shows live unread badge, marks read on open.
  - Auth STORY showcase — auto-advancing 4 AI-generated scenes (Cook → List → Orders → Earn) conveying the chef journey (replaces the single ambient video).
  - Order DETAILS dialog — click a card to see subscription progress (delivered/remaining, e.g. 5-day plan 2 delivered/3 left); postponed meals show postponed + new upcoming date with a chef Acknowledge action.
  - Stylish gradient legal footer with TM badge on auth screens.
  - Seed hardened to purge orphaned orders/menus/notifications on force reseed.
- Demo seed: 2 chefs, 3 menus (gallery+cover), 7 orders (CF1001-07) incl. CF1003 postpone example. Admin console at /admin.

## Simulated / Not Real
- OTP delivery, Google captcha, file storage, delivery partner dispatch (Porter/Rapido), support webhook.
- /admin has no auth guard (demo only).

## Backlog / Remaining
- P1: Real SMS OTP + reCAPTCHA; real object storage for uploads.
- P1: Real auth guard + admin RBAC.
- P2: Real logistics dispatch integration; support webhook to external tool.
- P2: Split server.py into routers; token validation middleware.
