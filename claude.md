# Ayonne E-Commerce Project

## Project Overview

This is a Next.js 16 e-commerce platform for Ayonne skincare products, replicating the original Shopify store at ayonne.skin.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand (cart persistence)
- **Language**: TypeScript
- **Deployment**: Railway

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (checkout, search, skin-analysis)
│   ├── cart/              # Shopping cart page
│   ├── checkout/          # Multi-step checkout flow
│   ├── collections/[slug] # Product collection pages
│   ├── pages/             # Static pages (about, contact, faq, shipping)
│   ├── policies/          # Policy pages (refund, privacy, terms)
│   ├── products/[slug]    # Product detail pages
│   └── skin-analysis/     # AI Skin Analysis feature
├── components/
│   ├── cart/              # CartDrawer
│   ├── layout/            # Header, Footer, Navigation, SearchModal
│   ├── product/           # ProductCard, AddToCartButton
│   └── skin-analysis/     # ImageUpload, AgedFaceComparison
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   ├── utils.ts           # Utility functions (formatPrice, cn, etc.)
│   ├── stripe.ts          # Stripe configuration (prepared)
│   └── skin-analysis/     # AI analysis logic
├── store/
│   └── cart.ts            # Zustand cart store
└── types/
    └── index.ts           # TypeScript interfaces
```

## Key Files

- `prisma/schema.prisma` - Database schema (Product, Order, Customer, Cart, etc.)
- `prisma/seed-data.json` - Product catalog data
- `src/app/layout.tsx` - Root layout with Header/Footer
- `src/app/page.tsx` - Homepage with hero, collections, featured products
- `src/store/cart.ts` - Cart state management with localStorage persistence

## Design System

- **Primary Background**: #F4EBE7 (warm beige)
- **Primary Color**: #1C4444 (dark teal)
- **Font**: IBM Plex Sans
- **Button Styles**: `.btn-primary`, `.btn-secondary` (defined in globals.css)

## Database Models

- **Product**: name, slug, description, price, salePrice, images, category, collection
- **Collection**: name, slug, description
- **Order**: orderNumber, status, items, shipping/billing addresses
- **Customer**: email, password, orders
- **Cart/CartItem**: session-based or customer-linked cart

## API Routes

- `POST /api/checkout` - Create order
- `GET /api/products/search?q=` - Product search
- `POST /api/skin-analysis/analyze` - AI skin analysis

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npx prisma studio    # Database GUI
npx prisma migrate dev  # Run migrations
npx ts-node prisma/seed.ts  # Seed products
```

## Environment Variables

```
DATABASE_URL=        # PostgreSQL connection string
NEXTAUTH_SECRET=     # Auth secret
NEXTAUTH_URL=        # App URL
```

## Features

- Product catalog with 8 collections
- Shopping cart with quantity controls
- Free shipping over $50
- Multi-step checkout (information → payment)
- Product search with debounced API calls
- AI Skin Analysis feature
- Responsive mobile-first design
