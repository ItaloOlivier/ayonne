import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerIdFromCookie } from '@/lib/auth'
import { del } from '@vercel/blob'

/**
 * Check if a URL is a Vercel Blob URL that can be deleted
 */
function isBlobUrl(url: string | null | undefined): url is string {
  if (!url) return false
  // Only delete if it's a Vercel Blob URL (not base64 data URLs)
  return url.startsWith('https://') && url.includes('blob.vercel-storage.com')
}

/**
 * Delete a blob from Vercel Blob storage
 * Silently ignores errors (blob may already be deleted or URL may be invalid)
 */
async function deleteBlobSafely(url: string): Promise<void> {
  try {
    await del(url)
    console.log(`[BLOB] Deleted: ${url.substring(0, 80)}...`)
  } catch (error) {
    // Ignore errors - blob may already be deleted or URL format may have changed
    console.warn(`[BLOB] Failed to delete (may already be gone): ${url.substring(0, 80)}...`)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get authenticated customer ID from cookie
    const authenticatedCustomerId = await getCustomerIdFromCookie()

    const analysis = await prisma.skinAnalysis.findUnique({
      where: { id },
    })

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // Security: Verify the requesting user owns this analysis
    if (analysis.customerId !== authenticatedCustomerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/skin-analysis/[id]
 *
 * Permanently deletes a skin analysis and all associated data:
 * - Database record
 * - All stored images (front, left, right, aged) from Vercel Blob storage
 *
 * Requires authentication and ownership verification.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get authenticated customer ID from cookie
    const authenticatedCustomerId = await getCustomerIdFromCookie()

    if (!authenticatedCustomerId) {
      return NextResponse.json(
        { error: 'Please log in to delete analyses' },
        { status: 401 }
      )
    }

    // Fetch the analysis to verify ownership and get image URLs
    const analysis = await prisma.skinAnalysis.findUnique({
      where: { id },
    })

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // Security: Verify the requesting user owns this analysis
    if (analysis.customerId !== authenticatedCustomerId) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only delete your own analyses' },
        { status: 403 }
      )
    }

    // Collect all blob URLs to delete
    const blobUrlsToDelete: string[] = []

    // Check each image field for blob URLs
    if (isBlobUrl(analysis.originalImage)) {
      blobUrlsToDelete.push(analysis.originalImage)
    }
    if (isBlobUrl(analysis.frontImage)) {
      blobUrlsToDelete.push(analysis.frontImage)
    }
    if (isBlobUrl(analysis.leftImage)) {
      blobUrlsToDelete.push(analysis.leftImage)
    }
    if (isBlobUrl(analysis.rightImage)) {
      blobUrlsToDelete.push(analysis.rightImage)
    }
    if (isBlobUrl(analysis.agedImage)) {
      blobUrlsToDelete.push(analysis.agedImage)
    }

    // Delete from database first
    await prisma.skinAnalysis.delete({
      where: { id },
    })

    console.log(`[DELETE] Analysis ${id} deleted from database`)

    // Delete all associated blobs in parallel
    if (blobUrlsToDelete.length > 0) {
      console.log(`[DELETE] Deleting ${blobUrlsToDelete.length} blob(s)...`)
      await Promise.all(blobUrlsToDelete.map(deleteBlobSafely))
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis and all associated images deleted successfully',
      deletedImages: blobUrlsToDelete.length,
    })
  } catch (error) {
    console.error('Error deleting analysis:', error)
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
      { status: 500 }
    )
  }
}
