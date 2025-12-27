import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerIdFromCookie, clearSessionCookie } from '@/lib/auth'
import { checkRateLimit, getClientIP, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit'
import { del } from '@vercel/blob'
import * as bcrypt from 'bcryptjs'

/**
 * DELETE /api/auth/delete-account
 * Permanently deletes a user's account and all associated data (GDPR compliance)
 * Requires password confirmation for security
 */
export async function DELETE(request: NextRequest) {
  try {
    // Rate limit by IP address
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(`delete-account:${clientIP}`, RATE_LIMITS.auth)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
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

    // Get password confirmation from request body
    const { password, confirmDelete } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to confirm account deletion' },
        { status: 400 }
      )
    }

    if (confirmDelete !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Please type "DELETE MY ACCOUNT" to confirm' },
        { status: 400 }
      )
    }

    // Fetch customer with password for verification
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        password: true,
        skinAnalyses: {
          select: {
            id: true,
            originalImage: true,
            frontImage: true,
            leftImage: true,
            rightImage: true,
            agedImage: true,
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

    // Verify password
    const isValidPassword = await bcrypt.compare(password, customer.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Delete all images from Vercel Blob storage
    const imageUrls: string[] = []
    for (const analysis of customer.skinAnalyses) {
      if (analysis.originalImage) imageUrls.push(analysis.originalImage)
      if (analysis.frontImage) imageUrls.push(analysis.frontImage)
      if (analysis.leftImage) imageUrls.push(analysis.leftImage)
      if (analysis.rightImage) imageUrls.push(analysis.rightImage)
      if (analysis.agedImage) imageUrls.push(analysis.agedImage)
    }

    // Delete images in parallel (with error handling)
    const deletePromises = imageUrls
      .filter(url => url.includes('blob.vercel-storage.com'))
      .map(url => del(url).catch(err => {
        console.warn(`Failed to delete blob: ${url}`, err)
        return null
      }))

    await Promise.all(deletePromises)

    // Delete all related data in order (cascade)
    // 1. Delete skin analyses
    await prisma.skinAnalysis.deleteMany({
      where: { customerId }
    })

    // 2. Delete cart items first, then cart
    const cart = await prisma.cart.findFirst({
      where: { customerId }
    })
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      })
      await prisma.cart.delete({
        where: { id: cart.id }
      })
    }

    // 3. Delete order items and orders
    const orders = await prisma.order.findMany({
      where: { customerId },
      select: { id: true }
    })
    for (const order of orders) {
      await prisma.orderItem.deleteMany({
        where: { orderId: order.id }
      })
    }
    await prisma.order.deleteMany({
      where: { customerId }
    })

    // 4. Finally delete the customer
    await prisma.customer.delete({
      where: { id: customerId }
    })

    // Clear session cookie
    const cookieData = clearSessionCookie()
    const response = NextResponse.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted'
    })

    response.cookies.set(cookieData.name, cookieData.value, cookieData.options as Parameters<typeof response.cookies.set>[2])

    console.log(`[PRIVACY] Account deleted: ${customer.email} (${customerId})`)

    return response
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again or contact support.' },
      { status: 500 }
    )
  }
}
