# MONO ACCESSORY
Online store for steel jewelry, quality costume jewelry, glasses and fashion accessories. Target: women 18-30 in Iran. UI language Persian, full RTL, currency Toman, dates shown in Jalali (Intl fa-IR-u-ca-persian, display only). Portfolio project that must be able to become a real business.

## Design
Style: Contemporary Feminine (modern, elegant, not fantasy, not cluttered). Editorial layouts plus minimal product grid. Palette: background rgb(255,249,242), primary rgb(128,0,32), dark rgb(45,0,0). Font: Pinar (local, public/fonts). No emojis in UI, no default system fonts, no default shadcn look, subtle motion only. Desktop and mobile equally important.

## Stack
Next.js App Router, React, TypeScript, Tailwind, shadcn/ui (customized, only needed components), motion package, PostgreSQL on Neon, Prisma, Zod, Vitest, Playwright (critical tests only).

## Auth
Mobile number + password. Custom JWT with jose, httpOnly secure cookie, bcryptjs hashing. No OTP now, but keep code structured so OTP can be added later.

## Features (MVP)
Pages: home (hero, collections, new, bestsellers, recommended, offers, footer), shop (grid, categories, filter, sort, search, price and stock), product detail (gallery with zoom, color/model variants, stock, description, specs, similar, add to cart, wishlist), about, contact, FAQ, terms, shipping and returns, collection pages, custom 404.
User: register/login, cart, wishlist, checkout, order tracking, order history and details.
Cart/order: add/remove/change qty, server-side totals, fixed shipping cost, free shipping above a configurable threshold, mock payment behind an interface so a real gateway can replace it. Variant stock is decreased inside a Prisma transaction on order creation; reject if insufficient.
Admin: products (with images, price, specs), categories, variants and stock, orders and status, customers, discounts, reviews, sales dashboard. All admin authorization on the server.

## Out of scope
Multi-vendor, wallet, loyalty, mobile app, real payment, OTP, advanced inventory, accounting.

## Phases (check off when done)
- [x] 1 Foundation (Next, fonts, RTL, tokens, shadcn, motion, format utils)
- [x] 2 Prisma schema and seed
- [x] 3 Design system and layout (header, footer, product card)
- [x] 4 Home page
- [x] 5 Shop page
- [ ] 6 Product detail
- [ ] 7 Auth
- [ ] 8 Cart
- [ ] 9 Checkout, mock payment, orders
- [ ] 10 User account (orders, wishlist)
- [ ] 11 Admin products, categories, stock
- [ ] 12 Admin orders and dashboard
- [ ] 13 Static pages, 404, SEO
- [ ] 14 Tests, README, env docs
- [ ] 15 Phase 2: discounts, reviews admin, stats
