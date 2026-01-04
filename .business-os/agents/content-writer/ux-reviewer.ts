/**
 * UX/UI Article Reviewer
 *
 * Reviews and improves article formatting before publishing:
 * - Ensures proper HTML structure
 * - Removes code blocks/markdown artifacts
 * - Ensures brand consistency
 * - Makes content mobile-friendly
 */

import type { GeneratedArticle } from './types'

export interface UXReviewResult {
  passed: boolean
  cleanedContent: string
  issues: string[]
  improvements: string[]
}

/**
 * Review and clean article content for UX/UI best practices
 */
export function reviewArticleUX(article: GeneratedArticle): UXReviewResult {
  const issues: string[] = []
  const improvements: string[] = []
  let content = article.content

  // =========================================================================
  // STEP 1: Remove markdown code blocks (```html ... ```)
  // =========================================================================
  if (content.includes('```html')) {
    content = content.replace(/```html\n?/g, '').replace(/```\n?/g, '')
    improvements.push('Removed markdown code block wrappers')
  }
  if (content.includes('```')) {
    content = content.replace(/```\w*\n?/g, '').replace(/```\n?/g, '')
    improvements.push('Removed remaining code block markers')
  }

  // =========================================================================
  // STEP 2: Ensure proper article wrapper
  // =========================================================================
  if (!content.includes('<article>') && !content.includes('<div class="article')) {
    // Wrap in article tag if missing
    content = `<article class="blog-article">\n${content}\n</article>`
    improvements.push('Added article wrapper for semantic HTML')
  }

  // =========================================================================
  // STEP 3: Check heading hierarchy
  // =========================================================================
  const h1Count = (content.match(/<h1[^>]*>/g) || []).length
  if (h1Count > 1) {
    issues.push(`Multiple H1 tags found (${h1Count}) - should only have one`)
  }
  if (h1Count === 0) {
    issues.push('No H1 tag found - article should have a main heading')
  }

  // =========================================================================
  // STEP 4: Ensure links open correctly
  // =========================================================================
  // External links should have target="_blank" and rel="noopener"
  content = content.replace(
    /<a href="(https?:\/\/(?!ayonne\.skin)[^"]+)"([^>]*)>/g,
    (match, url, attrs) => {
      if (!attrs.includes('target=')) {
        return `<a href="${url}"${attrs} target="_blank" rel="noopener noreferrer">`
      }
      return match
    }
  )

  // =========================================================================
  // STEP 5: Check for internal links to Ayonne products
  // =========================================================================
  const ayonneLinks = content.match(/href="https?:\/\/(www\.)?ayonne\.skin[^"]*"/g) || []
  const aiAyonneLinks = content.match(/href="https?:\/\/ai\.ayonne\.skin[^"]*"/g) || []

  if (ayonneLinks.length === 0 && aiAyonneLinks.length === 0) {
    issues.push('No links to Ayonne products or skin analysis - add CTAs')
  } else {
    improvements.push(`Found ${ayonneLinks.length + aiAyonneLinks.length} internal Ayonne links`)
  }

  // =========================================================================
  // STEP 6: Ensure mobile-friendly formatting
  // =========================================================================
  // Check for overly long paragraphs (bad for mobile)
  const paragraphs = content.match(/<p>[^<]{500,}<\/p>/g) || []
  if (paragraphs.length > 0) {
    issues.push(`${paragraphs.length} paragraphs are too long for mobile (500+ chars)`)
  }

  // =========================================================================
  // STEP 7: Add brand-consistent styling classes
  // =========================================================================
  // Add Ayonne styling to CTAs
  content = content.replace(
    /<a href="https:\/\/ai\.ayonne\.skin\/skin-analysis"([^>]*)>([^<]+)<\/a>/g,
    '<a href="https://ai.ayonne.skin/skin-analysis"$1 class="cta-button">$2</a>'
  )

  // =========================================================================
  // STEP 8: Ensure FAQ schema is valid
  // =========================================================================
  if (content.includes('itemtype="https://schema.org/FAQPage"')) {
    improvements.push('FAQ schema markup detected - good for SEO')
  }

  // =========================================================================
  // STEP 9: Clean up whitespace
  // =========================================================================
  content = content
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .replace(/^\s+/gm, '') // Remove leading whitespace from lines
    .trim()

  // =========================================================================
  // STEP 10: Final validation
  // =========================================================================
  const passed = issues.length === 0

  return {
    passed,
    cleanedContent: content,
    issues,
    improvements,
  }
}

/**
 * Apply UX review and return cleaned article
 */
export function cleanArticleForPublishing(article: GeneratedArticle): GeneratedArticle {
  const review = reviewArticleUX(article)

  console.log('[UXReviewer] Review complete:')
  console.log(`  - Passed: ${review.passed}`)
  console.log(`  - Issues: ${review.issues.length}`)
  console.log(`  - Improvements: ${review.improvements.length}`)

  if (review.issues.length > 0) {
    console.log('[UXReviewer] Issues found:')
    review.issues.forEach(issue => console.log(`    ⚠️  ${issue}`))
  }

  if (review.improvements.length > 0) {
    console.log('[UXReviewer] Improvements made:')
    review.improvements.forEach(imp => console.log(`    ✅ ${imp}`))
  }

  return {
    ...article,
    content: review.cleanedContent,
  }
}
