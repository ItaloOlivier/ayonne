import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerIdFromCookie } from '@/lib/auth'
import { ImageStorageConsent } from '@prisma/client'

/**
 * GET /api/account/image-consent
 * Get user's current image storage consent preference
 */
export async function GET() {
  try {
    const customerId = await getCustomerIdFromCookie()

    if (!customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        imageStorageConsent: true,
        consentUpdatedAt: true,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      imageStorageConsent: customer.imageStorageConsent,
      consentUpdatedAt: customer.consentUpdatedAt,
      // Helper fields for UI
      isAllowed: customer.imageStorageConsent === 'ALLOWED',
      isDenied: customer.imageStorageConsent === 'DENIED',
      isNotSet: customer.imageStorageConsent === 'NOT_SET',
    })
  } catch (error) {
    console.error('Get image consent error:', error)
    return NextResponse.json(
      { error: 'Failed to get consent preference' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/account/image-consent
 * Update user's image storage consent preference
 */
export async function PATCH(request: NextRequest) {
  try {
    const customerId = await getCustomerIdFromCookie()

    if (!customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { imageStorageConsent } = body

    // Validate the consent value
    const validConsents: ImageStorageConsent[] = ['ALLOWED', 'DENIED', 'NOT_SET']
    if (!imageStorageConsent || !validConsents.includes(imageStorageConsent)) {
      return NextResponse.json(
        { error: 'Invalid consent value. Must be ALLOWED, DENIED, or NOT_SET' },
        { status: 400 }
      )
    }

    // Update the customer's consent preference
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        imageStorageConsent: imageStorageConsent as ImageStorageConsent,
        consentUpdatedAt: new Date(),
      },
      select: {
        imageStorageConsent: true,
        consentUpdatedAt: true,
      },
    })

    console.log(`[CONSENT] Updated image consent for ${customerId}: ${imageStorageConsent}`)

    return NextResponse.json({
      success: true,
      imageStorageConsent: updatedCustomer.imageStorageConsent,
      consentUpdatedAt: updatedCustomer.consentUpdatedAt,
      isAllowed: updatedCustomer.imageStorageConsent === 'ALLOWED',
      isDenied: updatedCustomer.imageStorageConsent === 'DENIED',
    })
  } catch (error) {
    console.error('Update image consent error:', error)
    return NextResponse.json(
      { error: 'Failed to update consent preference' },
      { status: 500 }
    )
  }
}
