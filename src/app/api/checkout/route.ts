import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, email, shippingAddress, subtotal, tax, shipping, total } = body

    const orderNumber = generateOrderNumber()

    const order = await prisma.order.create({
      data: {
        orderNumber,
        email,
        subtotal,
        tax,
        shipping,
        total,
        shippingAddress,
        billingAddress: shippingAddress,
        status: 'PENDING',
        items: {
          create: items.map((item: { productId: string; quantity: number; price: number; name: string }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process order' },
      { status: 500 }
    )
  }
}
