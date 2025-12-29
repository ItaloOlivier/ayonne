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
│   │   ├── auth/
│   │   │   ├── login/        # Login API endpoint (sets session cookie)
│   │   │   ├── logout/       # Logout API endpoint (clears session cookie)
│   │   │   └── me/           # Get current user from cookie
│   │   └── skin-analysis/
│   │       ├── analyze/      # AI skin analysis endpoint
│   │       ├── history/      # User analysis history
│   │       ├── signup/       # User registration endpoint
│   │       └── trends/       # Skin health trends
│   ├── account/              # User account/profile page
│   ├── login/                # Login page
│   ├── forgot-password/      # Password reset request page
│   ├── my-recommendations/   # Saved product recommendations page
│   ├── skin-forecast/        # 90-day skin forecast page
│   ├── skin-analysis/
│   │   ├── page.tsx          # Upload photo page
│   │   ├── history/          # Analysis history page
│   │   ├── compare/          # Side-by-side analysis comparison
│   │   └── results/[id]/     # Analysis results page
│   └── page.tsx              # Homepage (AI analyzer focused)
├── components/
│   ├── layout/               # Header (with auth), Footer, Navigation
│   ├── ui/
│   │   └── Toast.tsx         # Toast notification system with context provider
│   └── skin-analysis/
│       ├── MultiAngleUpload.tsx      # 3-angle photo capture with face guide overlay
│       ├── SignupForm.tsx            # User registration form (email, name, password)
│       ├── AnalysisProgress.tsx      # Step-by-step analysis progress indicator
│       ├── QualityIndicator.tsx      # Real-time image quality feedback
│       ├── LiveCameraCapture.tsx     # Smart auto-capture with quality monitoring
│       ├── AnalysisResults.tsx
│       ├── ProductRecommendations.tsx  # Multi-select checkout with sorting
│       ├── SkincareAdvice.tsx
│       ├── SkinHealthScore.tsx       # Animated circular score with trend
│       ├── HistoryCard.tsx           # Compact history list cards (accessible)
│       ├── ProgressTimeline.tsx      # Analysis history list component
│       ├── DualScoreDisplay.tsx      # Skin age + quality score display (accessible)
│       ├── StreakCounter.tsx         # Fire animation streak tracking
│       ├── AchievementBadges.tsx     # Gamification badges
│       ├── SocialProof.tsx           # Live activity indicators
│       ├── ScarcityIndicator.tsx     # Stock/urgency elements
│       ├── CelebrationAnimation.tsx  # Confetti/unlock effects
│       ├── PersonalizedDashboard.tsx # User dashboard with goals
│       ├── SkinForecast.tsx      # 90-day projections and predictions
│       └── FaceAgeFilter.tsx     # Visual age simulation with CSS filters
│   └── growth/               # Growth hacking components
│       ├── SpinWheel.tsx         # Animated spin-to-win wheel
│       ├── DiscountTimer.tsx     # Countdown timer for expiring discounts
│       ├── ReferralDashboard.tsx # Referral stats and share buttons
│       ├── GuestEmailCapture.tsx # Email gate with discount incentive
│       ├── DiscountBadge.tsx     # Display available discount codes
│       └── ReferralBanner.tsx    # Sticky share banner
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── auth.ts               # Session cookie utilities (HTTP-only cookies)
│   ├── admin-auth.ts         # Admin API authentication middleware
│   ├── api-helpers.ts        # API route utilities (requireAuth, parseJsonBody, error responses)
│   ├── rate-limiter.ts       # IP-based rate limiting with configurable windows
│   ├── logger.ts             # Structured logging with sensitive data redaction
│   ├── shopify.ts            # Shopify URL helpers
│   ├── shopify-products.ts   # Product image/variant ID mapping (with discount support)
│   ├── shopify-admin/        # Modular Shopify Admin API (split from monolith)
│   │   ├── client.ts         # GraphQL client and isShopifyConfigured()
│   │   ├── discounts.ts      # Discount code CRUD operations
│   │   ├── products.ts       # Product queries and inventory sync
│   │   ├── customers.ts      # Customer management
│   │   ├── seo.ts            # SEO management and analysis
│   │   └── index.ts          # Re-exports all modules
│   ├── validation/           # Zod validation schemas and utilities
│   │   ├── schemas.ts        # Email, password, pagination, discount schemas
│   │   └── index.ts          # validateBody, validateQuery, formatZodErrors
│   ├── utils.ts              # Utility functions
│   ├── features.ts          # Feature flags for API capabilities
│   ├── growth/               # Growth hacking utilities
│   │   ├── referral.ts       # Referral code generation and tracking
│   │   ├── discount.ts       # Discount code management
│   │   ├── streak.ts         # Analysis streak tracking and rewards
│   │   ├── spin.ts           # Spin-to-win wheel logic
│   │   └── guest.ts          # Guest session management
│   └── skin-analysis/
│       ├── analyzer.ts       # Core analysis utilities with prompt caching
│       ├── cached-prompts.ts # Cached system prompts for cost optimization
│       ├── conditions.ts     # Skin condition definitions
│       ├── recommendations.ts # Product matching logic
│       ├── advice.ts         # Personalized skincare tips
│       ├── health-score.ts   # Legacy score calculation
│       ├── scoring.ts        # Dual scoring system (skin age + quality)
│       ├── tools.ts          # Tool definitions for dynamic features
│       ├── tool-handlers.ts  # Tool execution handlers
│       ├── tool-use-analyzer.ts    # Analysis with tool use
│       ├── extended-thinking.ts    # Deep reasoning for complex cases
│       ├── unified-analyzer.ts     # Intelligent method selection
│       ├── image-quality.ts        # Pre-analysis quality validation
│       ├── image-preprocessing.ts  # Server-side image normalization
│       ├── face-detection.ts       # Browser-based face detection
│       └── forecast.ts         # 90-day skin forecast projections
├── hooks/
│   ├── useLiveCamera.ts          # Live camera with auto-capture hook
│   └── useCopyToClipboard.ts     # Clipboard with fallback (used by 7+ components)
├── test/
│   └── setup.ts                  # Vitest test setup and mocks
└── types/
    └── index.ts
```

## Key Features

### AI Skin Analysis (3-Angle Capture)
- **Multi-angle photo capture**: Front, left profile, right profile
- Guided camera interface with face positioning overlay
  - Step-by-step capture flow with progress indicators
  - Angle-specific instructions and tips
  - 3-second countdown timer for each capture
  - Review screen with retake option per angle
- Claude AI analyzes all three angles for comprehensive assessment
- Detects: fine lines, wrinkles, dark spots, acne, dryness, oiliness, redness, dullness, large pores, uneven texture, dark circles, dehydration
- Smart fallback with varied results if AI unavailable
- All 3 images (front, left, right) stored compressed in database

### Anthropic API Capabilities
The skin analysis uses advanced Anthropic Claude API features:

- **Prompt Caching** (enabled by default): Caches system prompts for ~90% token cost reduction
  - System prompts marked with `cache_control: { type: 'ephemeral' }`
  - Cache metrics logged for monitoring
  - Feature flag: `FEATURE_PROMPT_CACHING`

- **Streaming** (opt-in): Real-time analysis feedback via SSE
  - Endpoint: `/api/skin-analysis/analyze-stream`
  - Hook: `useStreamingAnalysis()`
  - Component: `StreamingAnalysisView`
  - Feature flag: `FEATURE_STREAMING=true`

- **Tool Use** (opt-in): Dynamic product lookup during analysis
  - Tools: `lookup_products`, `check_ingredient_compatibility`, `build_routine`, `get_ingredient_benefits`
  - Enables Claude to query database and build personalized routines
  - Feature flag: `FEATURE_TOOL_USE=true`

- **Extended Thinking** (opt-in): Deep reasoning for complex cases
  - Triggered for users with 3+ previous analyses or 4+ conditions
  - Uses thinking budget of 10k tokens for step-by-step reasoning
  - Feature flag: `FEATURE_EXTENDED_THINKING=true`

- **Unified Analyzer**: Intelligently selects best method based on context
  - Import: `import { analyzeSkin } from '@/lib/skin-analysis/unified-analyzer'`
  - Auto-selects: standard, tool-use, or extended-thinking

- **Image Preprocessing** (enabled by default): Normalizes images before AI analysis
  - Auto white balance correction
  - Exposure normalization
  - Contrast enhancement
  - Feature flag: `FEATURE_IMAGE_PREPROCESSING`

### Image Quality System
- **Pre-analysis validation**: Checks images before sending to AI
  - Resolution (minimum 400x400)
  - Brightness (detects too dark < 40, overexposed > 220)
  - Contrast (ensures facial features visible, minimum 20)
- **Critical issue blocking**: API returns 400 error for unusable images
  - Too dark → "Please take photos in a well-lit area"
  - Overexposed → "Please avoid direct bright light sources"
  - Low resolution → "Please use a higher quality camera setting"
  - User sees detailed error with tips for retaking photos
- **Non-critical issues**: Minor contrast issues logged but analysis proceeds
- **Server-side preprocessing**: Uses Sharp library to normalize images
  - Corrects white balance for consistent skin tone detection
  - Normalizes exposure regardless of lighting conditions
  - Enhances contrast for better feature detection
- **QualityIndicator component**: Real-time feedback during camera capture
  - Live brightness meter
  - Quality badge (Excellent/Good/Acceptable/Poor)
  - Actionable warnings for issues

### Smart Auto-Capture
- **Live camera with quality monitoring**: `useLiveCamera` hook
  - Continuous quality assessment during video preview
  - Frame burst capture (3 frames at 200ms intervals)
  - Automatic best-frame selection based on quality score
- **Face detection**: Browser FaceDetector API with fallback
  - Detects face position and provides guidance
  - "Move closer", "Center your face", "Move left/right" feedback
  - Skin-tone heuristics for browsers without FaceDetector API
- **Auto-capture trigger**: Captures when conditions are optimal
  - Quality score above threshold (default: 70)
  - Face well-positioned in frame
  - Stable for 1.5 seconds (configurable)
  - Circular progress indicator shows countdown
- **LiveCameraCapture component**: Drop-in smart camera
  - Feature flag: `FEATURE_SMART_AUTO_CAPTURE`
  - Falls back to manual capture if disabled
- **Camera permission fallback**: Upload mode when camera access denied
  - Shows helpful error message with browser settings guidance
  - "Upload Photo Instead" button switches to file upload mode
  - Full 3-angle workflow preserved with file picker
  - "Try Camera Again" option to retry camera access

### Dual Scoring System
- **Skin Age**: Estimated biological skin age based on aging indicators
  - Fine lines, wrinkles, dark spots, dullness add years to skin age
  - Shows "Current: 38 → Achievable: 33" with 5-8 year improvement potential
  - Improvement is calculated based on reversibility of detected conditions
- **Skin Quality**: 0-100 score for overall skin health
  - Based on non-aging conditions (acne, oiliness, redness, pores, etc.)
  - Category breakdowns: hydration, clarity, texture, radiance
- Enables targeted product recommendations:
  - Anti-aging products for skin age concerns
  - Treatment products for skin quality concerns

### Product Recommendations
- Matches products to detected skin conditions
- Multi-select product cards with checkboxes
- "Checkout on Ayonne" button adds all selected to Shopify cart
- Shows total price for selected products
- Products link directly to Shopify store

### User Accounts & Cross-Device Sessions
- Email/password registration with bcrypt hashing
- Login page at `/login`
- Account/profile page at `/account`
- Analysis history tracking
- Skin health trends over time
- Logout functionality in header
- **HTTP-only session cookies** for cross-device authentication (30-day expiry)
- Users can log in on phone and laptop to access the same data
- Session managed server-side via `/api/auth/me` endpoint

### Skin Progress Page
- **Dual Score Overview**: Vitality + Health cards matching analysis results design
- **Skin Vitality Card**: Current age → Potential age with improvement indicator
- **Skin Health Card**: Circular progress ring with category breakdown (hydration, clarity, texture, radiance)
- **Stats Summary**: 4-column grid (Analyses, Vitality, Health Score, Health Change)
- **Trend Chart**: Line graph with period selector (week/month/3months/all)
- **History Cards**: Thumbnail + date + dual score circles (Vitality & Health)
- **Progress Tracking**: Shows improvement since first analysis for both scores
- **Compare Analyses**: Link to side-by-side comparison view (when 2+ analyses exist)

### Analysis Comparison Page
- **Side-by-side view**: Compare any two analyses
- **Dropdown selectors**: Choose earlier vs later analysis
- **Summary cards**: Health change, Vitality change, Days between
- **Image comparison**: Photos with date badges
- **Score comparison**: Color-coded score circles with change indicators
- **Category breakdown**: Bar chart comparison for hydration, clarity, texture, radiance

### Skin Forecast (90-Day Projections)
AI-powered predictions based on historical analysis data with product-driven improvements:

- **Dual Scenario System**: Shows two projections:
  - **With Ayonne Products**: Improvements only achievable with our products
  - **Natural Progression**: What happens without skincare (skin degrades)
- **Product-Condition Mapping**: Each condition maps to specific Ayonne products
  - Products have effectiveness ratings (e.g., Vitamin C Serum: 80% for dark spots)
  - Shows "Clears by day X" predictions for clearable conditions
  - "Add to Cart" buttons on each recommended product
- **Score Projections**: 30/60/90 day forecasts for skin age and quality score
- **Natural Degradation Rates**: Without products, conditions worsen:
  - Dryness, dehydration, dullness get worse fastest
  - Fine lines, wrinkles naturally deepen
  - Dark spots darken with sun exposure
- **Product Improvement Rates**: With products, conditions improve:
  - Uses condition-specific reversibility rates (e.g., dehydration: 95%, wrinkles: 40%)
  - Shows exact day for clearable conditions (e.g., "Acne: Day 45")
- **Face Age Filter**: Visual preview of transformation
  - **AI-powered age transformation** via Replicate SAM model (requires `REPLICATE_API_TOKEN`)
  - CSS filter fallback when AI service unavailable
  - **5 years younger** with Ayonne products (realistic improvement)
  - **10 years older** without products (realistic degradation)
  - Hold/tap to compare with original photo
  - Cost: ~$0.003 per transformation (~15 seconds)
  - API endpoint: `POST /api/face-aging`
- **Multi-Product Checkout**: Select products needed for results
  - Checkbox selection with running total
  - "Get These Results" button adds all to Shopify cart
- **Personalized Warnings**:
  - Degradation warnings for "without products" scenario
  - Seasonal alerts (winter dryness, summer oil)
  - Consistency tracking reminders
- **Luxury UI Design**: Amber/warm tones for natural progression (not harsh red)
- **Confidence Levels**: Low/medium/high based on analysis count and consistency
- **Consistency Score**: Tracks how regularly user analyzes (weekly = 100%)
- **API Endpoint**: `GET /api/skin-analysis/forecast` (returns latestPhoto for preview)
- **Page**: `/skin-forecast`
- **Components**: `SkinForecast.tsx`, `FaceAgeFilter.tsx`

### Gamification & Engagement
- **Streak Tracking**: Fire animation, milestone badges (7-day, 30-day), "at risk" warnings
- **Achievement System**: 14+ badge types (First Steps, Week Warrior, Glow Up, Flawless, etc.)
- **Health Score**: Animated circular progress with count-up effect, trend indicators
- **Social Proof**: Live activity feed banner on results page, recent purchase popups
- **Scarcity Indicators**: Stock warnings, viewer counts on top recommended product
- **Celebration Animations**: Confetti for +10 points, score-up for +5 points, achievement for new users
- **Daily Reminders**: Shown on history page if user hasn't analyzed today
- **PWA Install Prompt**: iOS/Android app install prompt on results page

### Growth Hacking System
Discount-driven viral growth mechanics:

- **Referral Program**: Tiered rewards system
  - User gets unique 8-character referral code
  - Share via WhatsApp, Email, SMS, or copy link
  - Tier progression: Bronze (1) → Silver (3) → Gold (5) → Platinum (10)
  - Rewards: 10% → 20% → 25% + Free Sample → 30% + Free Product
  - Referee gets 10% off first order

- **Spin-to-Win Wheel**: Appears when user scrolls to product recommendations
  - Prizes: 5% (40%), 10% (30%), 15% (18%), 20% (8%), Free Shipping (4%)
  - 24-hour expiry on spin rewards
  - One spin per analysis (per user)
  - Discount automatically applied to checkout cart URL

- **Streak Rewards**: Discount codes for consistent usage
  - 3 weekly analyses: 10% off
  - 7-day daily streak: 15% off
  - 4 weekly analyses (1 month): 20% off

- **Discount Timer**: Urgency countdown on results page
  - Pulses/highlights when under 1 hour remaining
  - Copy-to-clipboard functionality

- **Guest Analysis Flow**: Reduce friction to first analysis
  - One free analysis without account creation
  - Email capture after results shown (10% discount incentive)
  - Seamless conversion to full account (15% welcome bonus)
  - **Data expiry countdown**: Guest data deleted after 2 weeks if no account created
  - Countdown warning shows days/hours/minutes remaining with urgency styling

- **Referral Banner**: Sticky prompt on results page
  - "Share with a friend, you both save!"
  - Quick share buttons for social platforms

- **30-Day Glow Challenge**: Structured skin transformation program
  - Day 1: Baseline analysis (starting scores)
  - Day 7: First check-in (+10% off reward, "Week Warrior" badge)
  - Day 14: Midpoint analysis (+15% off reward, "Halfway Hero" badge)
  - Day 21: Final push ("Glow Getter" badge)
  - Day 30: Transformation reveal (+25% off reward, "Glow Master" badge)
  - Share transformation: Extra 10% off
  - Refer friend to challenge: Free product sample
  - Before/after comparison slider on completion
  - Progress tracking with checkpoint timeline
  - Automatic analysis recording during challenge
  - Challenge page: `/challenge`
  - API endpoints: `/api/challenge/join`, `/api/challenge/status`, `/api/challenge/record`, `/api/challenge/share`, `/api/challenge/refer`
  - Components: `ChallengeProgress`, `ChallengeJoin`, `TransformationReveal`

## Shopify Integration

All product purchases happen on the main Shopify store. This app provides:

```typescript
// src/lib/shopify.ts
export const SHOPIFY_STORE_URL = 'https://ayonne.skin'

// Single product link
getShopifyProductUrl(slug) → https://ayonne.skin/products/{slug}

// src/lib/shopify-products.ts
// Maps local slugs to Shopify variant IDs and CDN image URLs
SHOPIFY_PRODUCT_MAP = {
  'vitamin-c-lotion': {
    handle: 'vitamin-c-lotion-1',
    variantId: '53383867597148',
    imageUrl: 'https://cdn.shopify.com/...',
  },
  // ... 100+ products
}

// Multi-product cart using variant IDs
buildShopifyCartUrl(['vitamin-c-lotion', 'retinol-serum'])
→ https://ayonne.skin/cart/53383867597148:1,53383867564380:1

// Cart with discount code applied
buildShopifyCartUrl(['vitamin-c-lotion'], 'SPIN123ABC')
→ https://ayonne.skin/cart/53383867597148:1?discount=SPIN123ABC
```

## API Routes

### Authentication
- `POST /api/auth/login` - Login with email/password (sets HTTP-only session cookie)
- `POST /api/auth/logout` - Logout (clears session cookie)
- `POST /api/auth/logout-all` - Logout from all devices (revokes all session tokens)
- `GET /api/auth/me` - Get current authenticated user from cookie
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `DELETE /api/auth/delete-account` - Permanently delete account and all data (GDPR)
- `GET /api/auth/export-data` - Export all user data as JSON (GDPR data portability)

### Skin Analysis (all require authentication)
- `POST /api/skin-analysis/signup` - User registration (sets session cookie)
- `POST /api/skin-analysis/analyze-multi` - Analyze 3-angle photos (front, left, right) - primary endpoint
- `POST /api/skin-analysis/analyze` - Legacy single image endpoint (auth required, rate limited: 5/hour)
- `GET /api/skin-analysis/[id]` - Get specific analysis (owner only)
- `GET /api/skin-analysis/history` - Get user's analysis history (auth required)
- `GET /api/skin-analysis/trends` - Get skin health trends (auth required)
- `GET /api/skin-analysis/verify-customer` - Verify current session

### Face Aging
- `POST /api/face-aging` - AI face age transformation (requires `REPLICATE_API_TOKEN`)
  - Body: `{ imageUrl, targetAge }`
  - Returns: `{ success, transformedImage, targetAge }` or `{ error, fallback: true }` if unavailable
  - Uses Replicate SAM model (yuval-alaluf/sam) - realistic age transformation
  - Target ages are rounded to nearest decade (0, 10, 20, ... 100)

### Growth Hacking
- `POST /api/referral/generate` - Generate referral code for user
- `GET /api/referral/generate` - Get referral stats and code
- `GET /api/referral/validate/[code]` - Validate a referral code
- `POST /api/referral/apply` - Apply referral code on signup
- `GET /api/discount/my-codes` - Get user's available discount codes
- `GET /api/discount/validate/[code]` - Validate a discount code
- `POST /api/spin/play` - Spin the wheel (one per analysis)
- `GET /api/spin/available` - Check if spin is available
- `GET /api/streak/status` - Get streak status and rewards
- `POST /api/guest/start` - Create guest session for anonymous analysis
- `PATCH /api/guest/convert` - Capture email (partial conversion, 10% discount)
- `POST /api/guest/convert` - Full account conversion (15% welcome bonus)

### Admin Maintenance
- `GET /api/admin/cleanup` - Get stats on orphaned data to clean up
- `POST /api/admin/cleanup` - Run cleanup (deletes guest data older than 2 weeks)

## Database Models

- **Customer**: email, password, skinAnalyses, currentStreak, longestStreak, totalReferrals
- **SkinAnalysis**: sessionId, customerId, originalImage, skinType, conditions, recommendations, advice, status
- **Product**: name, slug, shopifySlug, description, price, images, skinConcerns, active (for matching)
  - `shopifySlug`: The actual Shopify product handle for linking (may differ from local slug)
  - `active`: Whether product exists on Shopify (filters inactive products from recommendations)

### Growth Hacking Models
- **ReferralCode**: Unique 8-char codes for users to share
- **Referral**: Tracks referrer → referee relationships and reward status
- **DiscountCode**: Various types (referral, streak, spin, welcome, guest, challenge)
- **GuestSession**: Anonymous sessions with optional email capture
- **SpinReward**: Spin wheel prizes with 24-hour expiry
- **StreakMilestone**: Achieved streak rewards (3-day, 7-day, 30-day)

### 30-Day Challenge Models
- **GlowChallenge**: Customer enrollment with baseline/final scores, reward codes, transformation sharing
- **ChallengeCheckpoint**: Day milestones (1, 7, 14, 21, 30) with scores, badges, and rewards
- **ChallengeStatus enum**: ACTIVE, COMPLETED, ABANDONED

## Environment Variables

```
DATABASE_URL=           # PostgreSQL connection string
ANTHROPIC_API_KEY=      # Claude API for skin analysis
BLOB_READ_WRITE_TOKEN=  # Vercel Blob for image storage
SESSION_SECRET=         # Secret for signing session tokens (required in production)

# Shopify Integration (optional - for auto-sync discount codes)
SHOPIFY_STORE_DOMAIN=   # Your Shopify store domain (e.g., 'ayonne.myshopify.com')
SHOPIFY_ADMIN_API_TOKEN= # Admin API access token with write_price_rules scope

# Admin API (required for admin endpoints)
ADMIN_API_KEY=          # Secret key for admin API access

# Replicate (optional - for AI face aging on Skin Forecast page)
REPLICATE_API_TOKEN=    # Get token at https://replicate.com/account/api-tokens (~$0.003/transform)
```

## Shopify Discount Code Integration

The growth hacking system generates discount codes that need to work on the Shopify checkout. There are two integration modes:

### Option A: Automatic Sync (Recommended)
When `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_ADMIN_API_TOKEN` are configured:
- Discount codes are automatically created in Shopify when generated
- Uses Shopify Admin API to create price rules and discount codes
- Sync status tracked in database (`shopifySynced`, `shopifyPriceRuleId`, `shopifyDiscountCodeId`)

To set up:
1. Go to Shopify Admin → Settings → Apps and sales channels → Develop apps
2. Create a new app with Admin API access
3. Grant `write_price_rules` and `read_price_rules` scopes
4. Copy the Admin API access token
5. Set `SHOPIFY_STORE_DOMAIN=ayonne.myshopify.com` (your .myshopify.com domain)
6. Set `SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxx`

### Option B: Manual Export
If Shopify API is not configured, use the admin export endpoint:
- `GET /api/admin/discounts/export` - Download CSV of unsynced codes
- Import CSV into Shopify Admin → Discounts → Import

### Admin Endpoints
All require `x-admin-key` header matching `ADMIN_API_KEY` env var:

#### Discount Management
- `GET /api/admin/discounts` - List all discount codes with sync status
  - Query params: `status=synced|unsynced|all`, `limit=100`
- `POST /api/admin/discounts` - Sync codes to Shopify
  - Body: `{ codeId: "..." }` for single code
  - Body: `{ syncAll: true }` for all unsynced codes
- `GET /api/admin/discounts/export` - Export as CSV
  - Query params: `format=csv|json`, `status=unsynced|synced|active`

#### SEO Management
- `GET /api/admin/seo` - Full SEO audit of all products
  - Query params: `type=audit|products|pages|catalog`, `handle=product-handle`
  - Returns: SEO scores, issues, recommendations for each product
- `POST /api/admin/seo` - Update product SEO
  - Body: `{ action: 'update', productId, title, description }` - Direct update
  - Body: `{ action: 'optimize', handle }` - Auto-generate optimized SEO
  - Body: `{ action: 'bulk-optimize' }` - Preview optimizations (no changes)

#### Data Cleanup
- `GET /api/admin/cleanup` - Get stats on orphaned data to be cleaned
- `POST /api/admin/cleanup` - Run cleanup (deletes guest data >2 weeks old)

### Cart URL with Discount
The `buildShopifyCartUrl()` function supports discount codes:
```typescript
buildShopifyCartUrl(['vitamin-c-lotion', 'retinol-serum'], 'SPIN15OFF')
→ https://ayonne.skin/cart/53383867597148:1,53383867564380:1?discount=SPIN15OFF
```

## AI Readiness & SEO

### AI Discovery Files (public/)
- `llms.txt` - Information for AI assistants about the AI skin analyzer
- `robots.txt` - Crawler permissions including AI bots (GPTBot, Claude-Web, etc.)

### SEO Functions (src/lib/shopify-admin.ts)
- `getProductSEO(handle)` - Get product SEO metadata
- `updateProductSEO(productId, { title, description })` - Update product SEO (requires write_products scope)
- `getAllProductsSEO()` - Bulk get all products with SEO data
- `analyzeSEOQuality(product)` - Analyze SEO score with issues and recommendations
- `generateOptimizedTitle(productName, category)` - Generate SEO-optimized title
- `generateOptimizedDescription(name, benefits, concerns)` - Generate SEO-optimized description
- `generateLLMSProductCatalog()` - Generate llms.txt-compatible product catalog

### Pre-Optimized SEO Data (src/lib/seo-data.ts)
Contains optimized SEO titles and descriptions for all products. Use with the SEO admin API to bulk update Shopify product metadata.

### Required Shopify API Scopes for SEO
- `write_products` - Update product SEO metadata
- `read_products` - Read product data
- `write_content` - Update page/blog SEO (optional)

## Security & Privacy Features

- **Signed session tokens**: HMAC-SHA256 signed cookies prevent forgery
- **Token revocation**: Server-side token invalidation via RevokedToken table
- **Authentication required**: All analysis endpoints require valid session
- **Rate limiting**: 5 analyses per customer per hour
- **Owner verification**: Users can only view their own analyses
- **HTTP-only cookies**: Session tokens not accessible via JavaScript
- **Secure cookies**: HTTPS-only in production
- **Image storage**: Photos stored as PNG lossless at 1400px max width for high-quality AI analysis and face aging

### GDPR/Privacy Compliance
- **Account deletion**: DELETE `/api/auth/delete-account` removes all user data
- **Data export**: GET `/api/auth/export-data` provides portable JSON export
- **Logout all devices**: POST `/api/auth/logout-all` revokes all active sessions
- **Data retention**: 90-day image retention, 30-day session tokens
- **Privacy policy**: Updated with skin analysis data handling details

## Development Commands

```bash
npm run dev             # Start dev server
npm run build           # Production build
npm run test            # Run tests in watch mode
npm run test:run        # Run tests once (CI mode)
npx prisma studio       # Database GUI
npx prisma db push      # Push schema to database
```

## Testing

The project uses **Vitest** with **jsdom** for testing. Test files are located alongside source files with `.test.ts` suffix.

```bash
npm run test:run        # Run all tests (54 tests across 4 files)
```

**Test coverage includes:**
- `src/lib/rate-limiter.test.ts` - Rate limiting utility (9 tests)
- `src/lib/api-helpers.test.ts` - API response helpers (10 tests)
- `src/lib/validation/validation.test.ts` - Zod schema validation (28 tests)
- `src/hooks/useCopyToClipboard.test.ts` - Clipboard hook (7 tests)

## Design System

- **Primary Background**: #F4EBE7 (warm beige)
- **Primary Color**: #1C4444 (dark teal)
- **Font**: IBM Plex Sans
- **Button Styles**: `.btn-primary`, `.btn-secondary` (8px border-radius, flexbox centered)
- **Button Variants**: `.btn-sm`, `.btn-lg`, `.btn-rounded` (pill shape)

### Luxury UI Components
- `.card-luxury` - Elevated white card with subtle shadow and border
- `.shadow-luxury` - Sophisticated soft shadow
- `.shadow-luxury-lg` - Larger luxury shadow for hover states
- `.btn-luxury` - Premium button styling
- `.animate-elegant-fade-in` - Refined fade-in entrance
- `.animate-gentle-glow` - Subtle pulsing glow effect

### CSS Animations (globals.css)
- `.animate-confetti` - Falling confetti effect
- `.animate-bounce-in` - Scale bounce entrance
- `.animate-score-up` - Score improvement celebration
- `.animate-achievement-unlock` - Badge unlock with rotation
- `.animate-sparkle` - Twinkling sparkle effect
- `.animate-shine` - Sweeping shine effect
- `.animate-slide-up` - Slide up entrance (toasts)
- `.animate-slide-in` - Slide in from left
- `.animate-pulse-ring` - Expanding ring pulse
- `.animate-float` - Gentle floating motion
- `.animate-scan-line` - Camera scan line for face guide

### Color Palette
- **Primary Teal**: #1C4444 - Main brand color, buttons, text
- **Gold Accent**: #D4AF37 - Premium highlights, eyebrow text, hover states
- **Warm Beige**: #F4EBE7 - Backgrounds
- **Quality Colors**: Brand-aligned tones for score display
  - Excellent (85+): #1C4444 (teal)
  - Good (70-84): #2D5A5A (lighter teal)
  - Fair (55-69): #8B7355 (warm bronze)
  - Needs Attention (40-54): #A67C52 (copper)
  - Needs Care (<40): #996B4A (terracotta)

### Accessibility
- **ARIA labels**: All color-coded score elements have descriptive aria-labels
- **Accessible functions** in `scoring.ts`:
  - `getQualityAccessibleLabel(score)` - Descriptive label for health scores
  - `getSkinAgeAccessibleLabel(skinAge, chronologicalAge)` - Descriptive label for vitality
  - `getCategoryAccessibleLabel(category, score)` - Descriptive label for category bars
- **Progress bars**: Use `role="progressbar"` with `aria-valuenow/min/max`
- **Tooltips**: Color-coded elements have title attributes for hover context
- **Semantic structure**: Proper headings, landmarks, and ARIA roles

## Deployment

- **Platform**: Railway
- **Domain**: ai.ayonne.skin
- **Auto-deploy**: On push to main branch
