# Ayonne - Science-Backed Skincare E-Commerce

A modern e-commerce platform for Ayonne skincare products, built with Next.js 16, Prisma, and Tailwind CSS.

## Features

- **Product Catalog**: Browse skincare products by category (Anti-Aging Serums, Moisturizers, Cleansers, etc.)
- **Shopping Cart**: Persistent cart with local storage
- **Checkout Flow**: Multi-step checkout with address forms
- **Search**: Real-time product search
- **Responsive Design**: Mobile-first design matching the original Shopify store
- **Policy Pages**: Refund, Privacy, Terms of Service, Shipping Info, FAQ

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Authentication**: NextAuth.js (prepared)
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ItaloOlivier/ayonne.git
cd ayonne
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your database connection string:
```
DATABASE_URL="postgresql://user:password@host:5432/database"
```

5. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```

6. Seed the database:
```bash
npx ts-node prisma/seed.ts
```

7. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── cart/              # Cart page
│   ├── checkout/          # Checkout flow
│   ├── collections/       # Product collection pages
│   ├── pages/             # Static pages (about, contact, faq)
│   ├── policies/          # Policy pages
│   └── products/          # Product detail pages
├── components/            # React components
│   ├── cart/             # Cart components
│   ├── layout/           # Header, Footer, Navigation
│   └── product/          # Product cards and buttons
├── lib/                   # Utilities and Prisma client
├── store/                 # Zustand store
└── types/                 # TypeScript types
```

## Deployment on Railway

1. Create a new project on [Railway](https://railway.app)
2. Add a PostgreSQL database
3. Connect your GitHub repository
4. Set environment variables:
   - `DATABASE_URL` (provided by Railway PostgreSQL)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
5. Deploy!

Railway will automatically:
- Build the Next.js application
- Run Prisma migrations
- Start the production server

## Payment Integration

The checkout flow is prepared for payment integration. Currently supports form-based checkout. To integrate with Payoneer or other payment providers:

1. Add your payment provider's SDK
2. Update the checkout API route (`/api/checkout/route.ts`)
3. Add webhook handlers for payment confirmations

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js |
| `NEXTAUTH_URL` | Your application URL |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

Private - Ayonne Skincare
