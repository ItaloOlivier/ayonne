import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerIdFromCookie } from '@/lib/auth'
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit'

/**
 * GET /api/auth/export-data
 * Exports all user data in JSON format (GDPR compliance - right to data portability)
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 3 exports per hour
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(`export-data:${clientIP}`, {
      limit: 3,
      windowSeconds: 60 * 60, // 1 hour
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many export requests. Please try again later.' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    // Verify authentication
    const customerId = await getCustomerIdFromCookie()
    if (!customerId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch all customer data
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        skinAnalyses: {
          select: {
            id: true,
            sessionId: true,
            skinType: true,
            conditions: true,
            recommendations: true,
            advice: true,
            status: true,
            createdAt: true,
            // Note: Image URLs included for completeness but are temporary storage
            originalImage: true,
            frontImage: true,
            leftImage: true,
            rightImage: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            email: true,
            status: true,
            subtotal: true,
            shipping: true,
            tax: true,
            total: true,
            shippingAddress: true,
            billingAddress: true,
            createdAt: true,
            items: {
              select: {
                name: true,
                quantity: true,
                price: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        cart: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            items: {
              select: {
                quantity: true,
                product: {
                  select: {
                    name: true,
                    price: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Format export data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      dataController: {
        name: 'Ayonne Skincare',
        website: 'https://ayonne.skin',
        contact: 'support@ayonne.skin',
      },
      userData: {
        profile: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          accountCreated: customer.createdAt,
        },
        skinAnalyses: customer.skinAnalyses.map(analysis => ({
          id: analysis.id,
          sessionId: analysis.sessionId,
          date: analysis.createdAt,
          skinType: analysis.skinType,
          conditions: analysis.conditions,
          recommendations: analysis.recommendations,
          advice: analysis.advice,
          status: analysis.status,
          // Include image URLs (note: these may expire)
          images: {
            front: analysis.frontImage || analysis.originalImage,
            left: analysis.leftImage,
            right: analysis.rightImage,
          }
        })),
        orders: customer.orders.map(order => ({
          orderNumber: order.orderNumber,
          date: order.createdAt,
          status: order.status,
          email: order.email,
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          items: order.items,
          totals: {
            subtotal: order.subtotal,
            shipping: order.shipping,
            tax: order.tax,
            total: order.total,
          }
        })),
        cart: customer.cart ? {
          items: customer.cart.items.map(item => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
          lastUpdated: customer.cart.updatedAt,
        } : null,
      },
      dataRetentionInfo: {
        skinAnalysisImages: 'Images are stored for 90 days after analysis',
        orderHistory: 'Order data retained for 7 years for legal compliance',
        accountData: 'Deleted upon account deletion request',
      },
      yourRights: {
        access: 'You can request a copy of your data at any time',
        rectification: 'You can update your profile information in account settings',
        erasure: 'You can delete your account via DELETE /api/auth/delete-account',
        portability: 'This export contains all your data in machine-readable format',
        complaint: 'You may lodge a complaint with your local data protection authority',
      }
    }

    // Return as downloadable JSON file
    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="ayonne-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })

    console.log(`[PRIVACY] Data export requested: ${customer.email} (${customerId})`)

    return response
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data. Please try again.' },
      { status: 500 }
    )
  }
}
