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
│       └── PersonalizedDashboard.tsx # User dashboard with goals
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── auth.ts               # Session cookie utilities (HTTP-only cookies)
│   ├── shopify.ts            # Shopify URL helpers
│   ├── shopify-products.ts   # Product image/variant ID mapping
│   ├── utils.ts              # Utility functions
│   ├── features.ts          # Feature flags for API capabilities
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
│       └── face-detection.ts       # Browser-based face detection
├── hooks/
│   └── useLiveCamera.ts          # Live camera with auto-capture hook
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
  - Resolution (minimum 640x640, ideal 1280x1280)
  - Brightness (detects too dark/overexposed)
  - Contrast (ensures facial features visible)
  - Sharpness (Laplacian variance for blur detection)
  - Color balance (detects color casts)
- **Weighted scoring**: Sharpness 30%, brightness 25%, contrast/resolution/color 15% each
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

### Gamification & Engagement
- **Streak Tracking**: Fire animation, milestone badges (7-day, 30-day), "at risk" warnings
- **Achievement System**: 14+ badge types (First Steps, Week Warrior, Glow Up, Flawless, etc.)
- **Health Score**: Animated circular progress with count-up effect, trend indicators
- **Social Proof**: Live activity feed, user counts, ratings display
- **Scarcity Indicators**: Stock warnings, viewer counts, countdown timers
- **Celebration Animations**: Confetti, score-up effects, achievement unlock animations
- **Personalized Dashboard**: Goals, progress bars, condition trends, daily reminders

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
```

## API Routes

### Authentication
- `POST /api/auth/login` - Login with email/password (sets HTTP-only session cookie)
- `POST /api/auth/logout` - Logout (clears session cookie)
- `GET /api/auth/me` - Get current authenticated user from cookie
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token

### Skin Analysis (all require authentication)
- `POST /api/skin-analysis/signup` - User registration (sets session cookie)
- `POST /api/skin-analysis/analyze-multi` - Analyze 3-angle photos (front, left, right) - primary endpoint
- `POST /api/skin-analysis/analyze` - Legacy single image endpoint (auth required, rate limited: 5/hour)
- `GET /api/skin-analysis/[id]` - Get specific analysis (owner only)
- `GET /api/skin-analysis/history` - Get user's analysis history (auth required)
- `GET /api/skin-analysis/trends` - Get skin health trends (auth required)
- `GET /api/skin-analysis/verify-customer` - Verify current session

## Database Models

- **Customer**: email, password, skinAnalyses
- **SkinAnalysis**: sessionId, customerId, originalImage, skinType, conditions, recommendations, advice, status
- **Product**: name, slug, shopifySlug, description, price, images, skinConcerns, active (for matching)
  - `shopifySlug`: The actual Shopify product handle for linking (may differ from local slug)
  - `active`: Whether product exists on Shopify (filters inactive products from recommendations)

## Environment Variables

```
DATABASE_URL=           # PostgreSQL connection string
ANTHROPIC_API_KEY=      # Claude API for skin analysis
BLOB_READ_WRITE_TOKEN=  # Vercel Blob for image storage
SESSION_SECRET=         # Secret for signing session tokens (required in production)
```

## Security Features

- **Signed session tokens**: HMAC-SHA256 signed cookies prevent forgery
- **Authentication required**: All analysis endpoints require valid session
- **Rate limiting**: 5 analyses per customer per hour
- **Owner verification**: Users can only view their own analyses
- **HTTP-only cookies**: Session tokens not accessible via JavaScript
- **Secure cookies**: HTTPS-only in production
- **Image compression**: Photos compressed to 800px/75% JPEG after AI analysis for storage efficiency

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
