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
- All 5 modules built and tested end-to-end (21/21 backend pytest, frontend E2E 100%).
- Demo seed: 2 chefs (demo@casafeast.com activated, newchef@casafeast.com onboarding), 3 menus, 7 orders.
- Admin console for verification/activation.
- Fixes: WelcomeDialog suppressed on onboarding route; DialogDescription a11y.

## Simulated / Not Real
- OTP delivery, Google captcha, file storage, delivery partner dispatch (Porter/Rapido), support webhook.
- /admin has no auth guard (demo only).

## Backlog / Remaining
- P1: Real SMS OTP + reCAPTCHA; real object storage for uploads.
- P1: Real auth guard + admin RBAC.
- P2: Real logistics dispatch integration; support webhook to external tool.
- P2: Split server.py into routers; token validation middleware.
