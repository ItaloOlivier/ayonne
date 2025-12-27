# Ayonne AI Skin Analyzer

## Project Overview

This is a Next.js 16 AI Skin Analyzer that works alongside the main Ayonne Shopify store at ayonne.skin. Users upload a photo, receive AI-powered skin analysis, and get personalized product recommendations that link directly to the Shopify store for checkout.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Hybrid Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │   AI Skin Analyzer   │         │    Shopify Store     │      │
│  │   (ai.ayonne.skin)   │◄───────►│   (ayonne.skin)      │      │
│  │                      │         │                      │      │
│  │  • Photo upload      │         │  • Product catalog   │      │
│  │  • AI analysis       │         │  • Shopping cart     │      │
│  │  • Recommendations   │         │  • Checkout/Payment  │      │
│  │  • Customer accounts │         │  • Order fulfillment │      │
│  └──────────────────────┘         └──────────────────────┘      │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────┐                                       │
│  │   Railway + Postgres  │                                       │
│  │   Anthropic Claude    │                                       │
│  │   Vercel Blob         │                                       │
│  └──────────────────────┘                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **AI Analysis**: Anthropic Claude API (image analysis)
- **Image Storage**: Vercel Blob
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Deployment**: Railway (ai.ayonne.skin)
- **E-commerce**: Shopify (ayonne.skin) - external

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── skin-analysis/
│   │       ├── analyze/      # AI skin analysis endpoint
│   │       ├── history/      # User analysis history
│   │       └── trends/       # Skin health trends
│   ├── skin-analysis/
│   │   ├── page.tsx          # Upload photo page
│   │   └── results/[id]/     # Analysis results page
│   └── page.tsx              # Homepage (AI analyzer focused)
├── components/
│   ├── layout/               # Header, Footer, Navigation
│   └── skin-analysis/
│       ├── ImageUpload.tsx
│       ├── AnalysisResults.tsx
│       ├── ProductRecommendations.tsx  # Multi-select checkout
│       ├── SkincareAdvice.tsx
│       ├── SkinHealthScore.tsx
│       └── HistoryCard.tsx
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── shopify.ts            # Shopify URL helpers
│   ├── utils.ts              # Utility functions
│   └── skin-analysis/
│       ├── conditions.ts     # Skin condition definitions
│       ├── recommendations.ts # Product matching logic
│       └── advice.ts         # Personalized skincare tips
└── types/
    └── index.ts
```

## Key Features

### AI Skin Analysis
- Upload photo via camera or file
- Claude AI analyzes for skin type and conditions
- Detects: fine lines, wrinkles, dark spots, acne, dryness, oiliness, redness, dullness, large pores, uneven texture, dark circles, dehydration
- Smart fallback with varied results if AI unavailable

### Product Recommendations
- Matches products to detected skin conditions
- Multi-select product cards with checkboxes
- "Checkout on Ayonne" button adds all selected to Shopify cart
- Shows total price for selected products
- Products link directly to Shopify store

### User Accounts
- Email/password registration
- One free analysis per day
- Analysis history tracking
- Skin health trends over time

## Shopify Integration

All product purchases happen on the main Shopify store. This app provides:

```typescript
// src/lib/shopify.ts
export const SHOPIFY_STORE_URL = 'https://ayonne.skin'

// Single product link
getShopifyProductUrl(slug) → https://ayonne.skin/products/{slug}

// Multi-product cart (for bulk checkout)
// Format: /cart/product-1:1,product-2:1,product-3:1
getCartUrl() → https://ayonne.skin/cart/{slug1}:1,{slug2}:1
```

## API Routes

- `POST /api/skin-analysis/analyze` - Analyze uploaded image (requires customerId)
- `GET /api/skin-analysis/history` - Get user's analysis history
- `GET /api/skin-analysis/trends` - Get skin health trends

## Database Models

- **Customer**: email, password, skinAnalyses
- **SkinAnalysis**: sessionId, customerId, originalImage, skinType, conditions, recommendations, advice, status
- **Product**: name, slug, description, price, images, skinConcerns (for matching)

## Environment Variables

```
DATABASE_URL=           # PostgreSQL connection string
ANTHROPIC_API_KEY=      # Claude API for skin analysis
BLOB_READ_WRITE_TOKEN=  # Vercel Blob for image storage
```

## Development Commands

```bash
npm run dev             # Start dev server
npm run build           # Production build
npx prisma studio       # Database GUI
npx prisma db push      # Push schema to database
```

## Design System

- **Primary Background**: #F4EBE7 (warm beige)
- **Primary Color**: #1C4444 (dark teal)
- **Font**: IBM Plex Sans
- **Button Styles**: `.btn-primary`, `.btn-secondary`

## Deployment

- **Platform**: Railway
- **Domain**: ai.ayonne.skin
- **Auto-deploy**: On push to main branch
