export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  salePrice?: number | null
  images: string[]
  category: string
  collection: string
  ingredients?: string | null
  benefits?: string | null
  howToUse?: string | null
  inStock: boolean
  featured: boolean
}

export interface Collection {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
}

export interface CartItem {
  id: string
  productId: string
  product: Product
  quantity: number
}

export interface Cart {
  id: string
  items: CartItem[]
}

export interface Order {
  id: string
  orderNumber: string
  email: string
  status: OrderStatus
  subtotal: number
  tax: number
  shipping: number
  total: number
  shippingAddress: Address
  billingAddress: Address
  items: OrderItem[]
  createdAt: Date
}

export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  price: number
  name: string
}

export interface Address {
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type AnalysisStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'

export interface SkinAnalysis {
  id: string
  sessionId?: string | null
  customerId?: string | null
  originalImage: string
  agedImage?: string | null
  skinType?: string | null
  conditions: DetectedCondition[]
  recommendations?: ProductRecommendation[] | null
  advice?: AdviceItem[] | null
  status: AnalysisStatus
  errorMessage?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DetectedCondition {
  id: string
  name: string
  confidence: number
  description: string
}

export interface ProductRecommendation {
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  productPrice: number
  productSalePrice: number | null
  reason: string
  relevanceScore: number
}

export interface AdviceItem {
  title: string
  tip: string
  priority: 'high' | 'medium' | 'low'
}
