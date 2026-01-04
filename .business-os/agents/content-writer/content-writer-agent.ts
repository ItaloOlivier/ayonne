/**
 * Content Writer Agent
 *
 * Autonomous content generation and publishing agent focused on
 * Colorado regional SEO and dry climate skincare content.
 *
 * Capabilities:
 * - Generate SEO-optimized articles based on content briefs
 * - Publish directly to Shopify blog
 * - Track content quality metrics
 * - Identify content gaps and opportunities
 * - Manage content calendar
 */

import type {
  ContentWriterConfig,
  ArticleBrief,
  GeneratedArticle,
  ContentWriterReport,
  QualityAssessment,
  SEOMeta,
  ArticleOutline,
  ArticleType,
  RegionalFocus,
  ProductMention,
  ContentGap,
  ContentRecommendation,
  ArticleStructuredData,
} from './types'
import {
  COLORADO_CONTENT_STRATEGY,
  COLORADO_CONFIG,
  AYONNE_BRAND_VOICE,
  CONTENT_GUIDELINES,
  ARTICLE_TEMPLATES,
  COLORADO_CITIES,
  COLORADO_KEYWORDS,
} from './colorado-config'

// ============================================================================
// CONTENT WRITER AGENT
// ============================================================================

export class ContentWriterAgent {
  private config: ContentWriterConfig | null = null
  private initialized: boolean = false
  private generatedArticles: GeneratedArticle[] = []
  private contentBriefs: ArticleBrief[] = []

  constructor() {
    // Agent is created but not initialized
  }

  /**
   * Initialize the agent with configuration
   */
  async initialize(config: Partial<ContentWriterConfig> = {}): Promise<void> {
    this.config = {
      primaryRegion: COLORADO_CONTENT_STRATEGY,
      brandVoice: AYONNE_BRAND_VOICE,
      contentGuidelines: CONTENT_GUIDELINES,
      shopifyBlogId: config.shopifyBlogId || 'gid://shopify/Blog/108098158940',
      defaultAuthor: config.defaultAuthor || 'Ayonne Skincare',
      publishingApproval: config.publishingApproval || 'manual',
      reviewThreshold: config.reviewThreshold || 80,
      targetKeywordDensity: config.targetKeywordDensity || { min: 1, max: 3 },
      minInternalLinks: config.minInternalLinks || 3,
      includeSchema: config.includeSchema ?? true,
      anthropicApiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
      shopifyAdminToken: config.shopifyAdminToken || process.env.SHOPIFY_ADMIN_API_TOKEN,
    }

    this.initialized = true
    console.log('[ContentWriterAgent] Initialized with Colorado focus')
  }

  /**
   * Check if agent is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  // ==========================================================================
  // CONTENT BRIEF GENERATION
  // ==========================================================================

  /**
   * Generate a content brief for a Colorado city landing page
   */
  generateCityLandingBrief(citySlug: string): ArticleBrief {
    const city = COLORADO_CITIES.find((c) => c.slug === citySlug)
    if (!city) {
      throw new Error(`City not found: ${citySlug}`)
    }

    const briefId = `brief_${citySlug}_${Date.now()}`
    const slug = `skincare-${citySlug}-colorado`

    const brief: ArticleBrief = {
      id: briefId,
      title: `${city.name} Colorado Skincare Guide | Expert Tips for ${city.altitude > 5200 ? 'High Altitude' : 'Mountain'} Skin`,
      slug,
      targetKeyword: `${city.name} skincare`,
      secondaryKeywords: city.primaryKeywords,
      contentType: 'local_landing',
      targetWordCount: 1500,
      outline: this.generateCityOutline(city),
      seoMeta: this.generateCitySEOMeta(city),
      regionalFocus: this.generateRegionalFocus(city),
      productMentions: this.suggestProductsForCity(city),
      internalLinks: this.generateInternalLinks('city_landing'),
      ctaStrategy: {
        primaryCTA: {
          type: 'skin_analysis',
          text: `Get Your Free ${city.name} Skin Analysis`,
          url: 'https://ai.ayonne.skin/skin-analysis',
          placement: 'end_of_section',
        },
        secondaryCTAs: [
          {
            type: 'product',
            text: 'Shop Hydration Products',
            url: 'https://ayonne.skin/collections/hydration',
            placement: 'inline',
          },
        ],
        frequency: 'moderate',
      },
      createdAt: new Date(),
    }

    this.contentBriefs.push(brief)
    return brief
  }

  /**
   * Generate a content brief for a seasonal guide
   */
  generateSeasonalBrief(
    season: 'winter' | 'spring' | 'summer' | 'fall'
  ): ArticleBrief {
    const seasonConfig = COLORADO_CONFIG.seasonalCalendar.find(
      (s) => s.season === season
    )
    if (!seasonConfig) {
      throw new Error(`Season config not found: ${season}`)
    }

    const briefId = `brief_${season}_colorado_${Date.now()}`
    const capitalizedSeason = season.charAt(0).toUpperCase() + season.slice(1)

    const brief: ArticleBrief = {
      id: briefId,
      title: `${capitalizedSeason} Skincare in Colorado: Your Complete Guide to ${capitalizedSeason} Skin Protection`,
      slug: `colorado-${season}-skincare-guide`,
      targetKeyword: `Colorado ${season} skincare`,
      secondaryKeywords: seasonConfig.contentThemes.slice(0, 5),
      contentType: 'seasonal_guide',
      targetWordCount: 1200,
      outline: this.generateSeasonalOutline(season, seasonConfig.contentThemes),
      seoMeta: {
        title: `${capitalizedSeason} Skincare in Colorado | ${new Date().getFullYear()} Guide`,
        description: `Essential ${season} skincare tips for Colorado's unique climate. Combat ${season === 'winter' ? 'dry indoor heating and cold winds' : 'high altitude sun and outdoor exposure'} with our expert guide.`,
      },
      regionalFocus: {
        primaryCity: 'Denver',
        state: 'Colorado',
        metropolitanArea: 'Denver Metro',
        climateFactors: {
          altitude: 'high',
          humidity: 'very_low',
          averageTemperature:
            season === 'winter'
              ? { winter: 32, summer: 75 }
              : { winter: 35, summer: 85 },
          sunExposure: 'intense',
          primaryConcerns:
            season === 'winter'
              ? ['dehydration', 'barrier damage', 'wind burn']
              : ['sun damage', 'dehydration', 'sweat-related breakouts'],
        },
        localKeywords: [
          `Colorado ${season} skin`,
          `Denver ${season} skincare`,
          `${season} dry skin Colorado`,
        ],
      },
      productMentions: this.suggestProductsForSeason(season),
      internalLinks: this.generateInternalLinks('seasonal'),
      ctaStrategy: {
        primaryCTA: {
          type: 'skin_analysis',
          text: 'Analyze Your Skin for Free',
          url: 'https://ai.ayonne.skin/skin-analysis',
          placement: 'end_of_section',
        },
        secondaryCTAs: [],
        frequency: 'light',
      },
      createdAt: new Date(),
    }

    this.contentBriefs.push(brief)
    return brief
  }

  /**
   * Generate a pillar page brief
   */
  generatePillarBrief(topic: string): ArticleBrief {
    const briefId = `brief_pillar_${topic}_${Date.now()}`

    const topicTitles: Record<string, string> = {
      high_altitude:
        'The Complete Guide to High Altitude Skincare | Living Above 5,000 Feet',
      dry_climate:
        'Skincare for Dry Climates: Your Complete Desert & Mountain Guide',
      hydration:
        'Ultimate Hydration Guide: Combat Colorado\'s Dry Climate',
      winter_prep:
        'Preparing Your Skin for Colorado Winter: The Complete Guide',
    }

    const brief: ArticleBrief = {
      id: briefId,
      title: topicTitles[topic] || `Complete ${topic} Guide for Colorado Living`,
      slug: `${topic.replace(/_/g, '-')}-skincare-guide`,
      targetKeyword: `${topic.replace(/_/g, ' ')} skincare`,
      secondaryKeywords: COLORADO_KEYWORDS.filter((k) => k.priority > 70).map(
        (k) => k.keyword
      ),
      contentType: 'pillar_page',
      targetWordCount: 2500,
      outline: this.generatePillarOutline(topic),
      seoMeta: {
        title: topicTitles[topic]?.slice(0, 60) || `${topic} Skincare Guide`,
        description: `Expert guide to ${topic.replace(/_/g, ' ')} skincare. Science-backed tips, product recommendations, and personalized advice for Colorado living.`,
      },
      regionalFocus: {
        primaryCity: 'Denver',
        state: 'Colorado',
        metropolitanArea: 'Statewide',
        climateFactors: {
          altitude: 'high',
          humidity: 'very_low',
          averageTemperature: { winter: 32, summer: 85 },
          sunExposure: 'intense',
          primaryConcerns: [
            'chronic dehydration',
            'UV damage',
            'barrier function',
          ],
        },
        localKeywords: [`Colorado ${topic}`, `Denver ${topic}`, `altitude ${topic}`],
      },
      productMentions: [],
      internalLinks: this.generateInternalLinks('pillar'),
      ctaStrategy: {
        primaryCTA: {
          type: 'skin_analysis',
          text: 'Get Your Personalized Skin Analysis',
          url: 'https://ai.ayonne.skin/skin-analysis',
          placement: 'end_of_section',
        },
        secondaryCTAs: [
          {
            type: 'guide',
            text: 'Explore Our Skincare Guides',
            url: 'https://ai.ayonne.skin/guides',
            placement: 'inline',
          },
        ],
        frequency: 'moderate',
      },
      createdAt: new Date(),
    }

    this.contentBriefs.push(brief)
    return brief
  }

  // ==========================================================================
  // CONTENT GENERATION
  // ==========================================================================

  /**
   * Generate article content from a brief
   */
  async generateArticle(brief: ArticleBrief): Promise<GeneratedArticle> {
    if (!this.initialized || !this.config) {
      throw new Error('Agent not initialized')
    }

    console.log(`[ContentWriterAgent] Generating article: ${brief.title}`)

    // Build the prompt for Claude
    const prompt = this.buildGenerationPrompt(brief)

    // In production, this would call Claude API
    // For now, we generate a structured placeholder
    const content = await this.callClaudeForContent(brief, prompt)

    const article: GeneratedArticle = {
      id: `article_${Date.now()}`,
      briefId: brief.id,
      title: brief.title,
      slug: brief.slug,
      content,
      wordCount: this.countWords(content),
      readingTime: Math.ceil(this.countWords(content) / 200),
      seoMeta: brief.seoMeta,
      structuredData: this.generateStructuredData(brief),
      status: 'draft',
      qualityScore: this.assessQuality(content, brief),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.generatedArticles.push(article)
    return article
  }

  /**
   * Build the generation prompt for Claude
   */
  private buildGenerationPrompt(brief: ArticleBrief): string {
    return `You are an expert skincare content writer for Ayonne, a skincare brand focusing on Colorado and dry climate skincare.

Write a comprehensive ${brief.contentType.replace(/_/g, ' ')} article with the following specifications:

TITLE: ${brief.title}
TARGET KEYWORD: ${brief.targetKeyword}
SECONDARY KEYWORDS: ${brief.secondaryKeywords.join(', ')}
TARGET WORD COUNT: ${brief.targetWordCount} words

REGIONAL FOCUS:
- Primary City: ${brief.regionalFocus.primaryCity}, ${brief.regionalFocus.state}
- Climate: ${brief.regionalFocus.climateFactors.altitude} altitude, ${brief.regionalFocus.climateFactors.humidity} humidity
- Primary Skin Concerns: ${brief.regionalFocus.climateFactors.primaryConcerns.join(', ')}

OUTLINE:
${this.formatOutline(brief.outline)}

BRAND VOICE:
- Tone: ${this.config!.brandVoice.tone.join(', ')}
- Style: ${this.config!.brandVoice.writingStyle}
- Avoid: ${this.config!.brandVoice.avoidWords.join(', ')}

CONTENT GUIDELINES:
- Must include: ${this.config!.contentGuidelines.mustInclude.join('; ')}
- Never include: ${this.config!.contentGuidelines.neverInclude.join('; ')}
- Include disclaimer: ${this.config!.contentGuidelines.disclaimerText}

PRODUCTS TO MENTION:
${brief.productMentions.map((p) => `- ${p.productName}: ${p.mentionContext}`).join('\n')}

INTERNAL LINKS TO INCLUDE:
${brief.internalLinks.map((l) => `- [${l.anchorText}](${l.targetUrl}) - ${l.context}`).join('\n')}

CTA STRATEGY:
- Primary CTA: "${brief.ctaStrategy.primaryCTA.text}" → ${brief.ctaStrategy.primaryCTA.url}
- Frequency: ${brief.ctaStrategy.frequency}

Write the full article in HTML format with proper heading hierarchy (h2, h3), paragraphs, and formatting.
Include the FAQ section with proper FAQ schema-ready markup if applicable.`
  }

  /**
   * Call Claude API for content generation
   */
  private async callClaudeForContent(
    brief: ArticleBrief,
    prompt: string
  ): Promise<string> {
    // In production, this would call the Anthropic API
    // For development, return a structured placeholder

    if (!this.config?.anthropicApiKey) {
      console.log('[ContentWriterAgent] No API key - generating placeholder content')
      return this.generatePlaceholderContent(brief)
    }

    try {
      // This would be the actual API call:
      // const response = await anthropic.messages.create({
      //   model: 'claude-3-5-sonnet-20241022',
      //   max_tokens: 4000,
      //   messages: [{ role: 'user', content: prompt }],
      // })
      // return response.content[0].text

      // For now, return placeholder
      return this.generatePlaceholderContent(brief)
    } catch (error) {
      console.error('[ContentWriterAgent] API error:', error)
      return this.generatePlaceholderContent(brief)
    }
  }

  /**
   * Generate placeholder content for development
   */
  private generatePlaceholderContent(brief: ArticleBrief): string {
    const sections = brief.outline.sections
      .map(
        (section) => `
<h${section.headingLevel}>${section.heading}</h${section.headingLevel}>
<p>${section.keyPoints.join(' ')}</p>
<p>[Content for ${section.heading} - approximately ${section.targetWordCount} words discussing ${brief.targetKeyword} in the context of ${brief.regionalFocus.primaryCity}, Colorado.]</p>
`
      )
      .join('\n')

    return `
<article>
<h1>${brief.title}</h1>

<p class="intro">${brief.outline.introduction.keyPoints.join(' ')}</p>

${sections}

<h2>Conclusion</h2>
<p>${brief.outline.conclusion.keyPoints.join(' ')}</p>

${brief.outline.faq ? this.formatFAQSection(brief.outline.faq) : ''}

<p class="cta">
  <a href="${brief.ctaStrategy.primaryCTA.url}">${brief.ctaStrategy.primaryCTA.text}</a>
</p>

<p class="disclaimer"><em>${this.config?.contentGuidelines.disclaimerText}</em></p>
</article>
`
  }

  // ==========================================================================
  // QUALITY ASSESSMENT
  // ==========================================================================

  /**
   * Assess content quality
   */
  private assessQuality(content: string, brief: ArticleBrief): QualityAssessment {
    const wordCount = this.countWords(content)
    const issues: QualityAssessment['issues'] = []
    const suggestions: string[] = []

    // Word count check
    const wordCountScore =
      wordCount >= brief.targetWordCount * 0.9
        ? 100
        : (wordCount / brief.targetWordCount) * 100

    if (wordCount < brief.targetWordCount * 0.8) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: `Word count (${wordCount}) is below target (${brief.targetWordCount})`,
      })
    }

    // Keyword density check
    const keywordCount = (
      content.toLowerCase().match(new RegExp(brief.targetKeyword.toLowerCase(), 'g')) ||
      []
    ).length
    const keywordDensity = (keywordCount / wordCount) * 100
    const keywordScore =
      keywordDensity >= 1 && keywordDensity <= 3
        ? 100
        : keywordDensity < 1
          ? keywordDensity * 100
          : Math.max(0, 100 - (keywordDensity - 3) * 20)

    if (keywordDensity < 1) {
      suggestions.push(`Increase mentions of "${brief.targetKeyword}"`)
    } else if (keywordDensity > 3) {
      issues.push({
        type: 'warning',
        category: 'seo',
        message: 'Keyword density too high - may appear spammy',
      })
    }

    // Internal links check
    const linkCount = (content.match(/<a\s+href=/gi) || []).length
    const linkScore = Math.min(100, (linkCount / this.config!.minInternalLinks) * 100)

    if (linkCount < this.config!.minInternalLinks) {
      suggestions.push(
        `Add ${this.config!.minInternalLinks - linkCount} more internal links`
      )
    }

    // Regional relevance check
    const regionalTerms = brief.regionalFocus.localKeywords.concat([
      brief.regionalFocus.primaryCity,
      brief.regionalFocus.state,
    ])
    const regionalMentions = regionalTerms.filter((term) =>
      content.toLowerCase().includes(term.toLowerCase())
    ).length
    const regionalScore = Math.min(100, (regionalMentions / regionalTerms.length) * 100)

    if (regionalScore < 50) {
      suggestions.push('Add more regional context and local keywords')
    }

    // Product integration check
    const productMentions = brief.productMentions.filter((p) =>
      content.toLowerCase().includes(p.productName.toLowerCase())
    ).length
    const productScore =
      brief.productMentions.length > 0
        ? (productMentions / brief.productMentions.length) * 100
        : 100

    // Calculate overall score
    const overall = Math.round(
      wordCountScore * 0.2 +
        keywordScore * 0.2 +
        linkScore * 0.15 +
        regionalScore * 0.25 +
        productScore * 0.1 +
        80 * 0.1 // Base readability score
    )

    return {
      overall,
      readability: 80, // Would use Flesch-Kincaid in production
      seoOptimization: Math.round((keywordScore + linkScore) / 2),
      keywordDensity: Math.round(keywordDensity * 10) / 10,
      internalLinking: linkScore,
      regionalRelevance: regionalScore,
      productIntegration: productScore,
      issues,
      suggestions,
    }
  }

  // ==========================================================================
  // CONTENT GAP ANALYSIS
  // ==========================================================================

  /**
   * Identify content gaps based on keyword targets
   */
  identifyContentGaps(): ContentGap[] {
    const gaps: ContentGap[] = []

    // Check which city landing pages are missing
    for (const city of COLORADO_CITIES) {
      const hasContent = this.generatedArticles.some(
        (a) => a.slug.includes(city.slug) && a.status === 'published'
      )
      if (!hasContent) {
        gaps.push({
          topic: `${city.name} landing page`,
          missingKeywords: city.primaryKeywords,
          competitorsCovering: [],
          priority: city.population > 500000 ? 'high' : 'medium',
          suggestedArticleType: 'local_landing',
        })
      }
    }

    // Check seasonal content
    const currentMonth = new Date().getMonth() + 1
    const upcomingSeason = this.getUpcomingSeason(currentMonth)
    const hasSeasonalContent = this.generatedArticles.some(
      (a) =>
        a.slug.includes(upcomingSeason) &&
        a.status === 'published' &&
        new Date().getFullYear() ===
          (a.publishedAt || a.createdAt).getFullYear()
    )

    if (!hasSeasonalContent) {
      gaps.push({
        topic: `${upcomingSeason} seasonal guide`,
        missingKeywords: [`Colorado ${upcomingSeason} skincare`],
        competitorsCovering: [],
        priority: 'high',
        suggestedArticleType: 'seasonal_guide',
      })
    }

    // Check pillar pages
    const pillarTopics = ['high_altitude', 'dry_climate', 'hydration']
    for (const topic of pillarTopics) {
      const hasPillar = this.generatedArticles.some(
        (a) => a.slug.includes(topic) && a.status === 'published'
      )
      if (!hasPillar) {
        gaps.push({
          topic: `${topic.replace(/_/g, ' ')} pillar page`,
          missingKeywords: COLORADO_KEYWORDS.filter(
            (k) => k.keyword.includes(topic.replace(/_/g, ' '))
          ).map((k) => k.keyword),
          competitorsCovering: COLORADO_CONFIG.competitorUrls,
          priority: 'high',
          suggestedArticleType: 'pillar_page',
        })
      }
    }

    return gaps
  }

  /**
   * Generate content recommendations
   */
  generateRecommendations(): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = []
    const gaps = this.identifyContentGaps()

    // Prioritize gaps
    for (const gap of gaps) {
      recommendations.push({
        type: 'new_article',
        priority: gap.priority === 'high' ? 90 : gap.priority === 'medium' ? 70 : 50,
        description: `Create ${gap.suggestedArticleType.replace(/_/g, ' ')}: ${gap.topic}`,
        expectedImpact: `Target keywords: ${gap.missingKeywords.slice(0, 3).join(', ')}`,
        effort: gap.suggestedArticleType === 'pillar_page' ? 'high' : 'medium',
      })
    }

    // Check for articles needing updates
    const staleArticles = this.generatedArticles.filter((a) => {
      const ageInDays =
        (Date.now() - a.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      return ageInDays > 180 && a.status === 'published'
    })

    for (const article of staleArticles) {
      recommendations.push({
        type: 'update_existing',
        priority: 60,
        description: `Update stale content: ${article.title}`,
        expectedImpact: 'Refresh content for continued relevance',
        effort: 'low',
      })
    }

    // Sort by priority
    return recommendations.sort((a, b) => b.priority - a.priority)
  }

  // ==========================================================================
  // REPORTING
  // ==========================================================================

  /**
   * Generate comprehensive report
   */
  generateReport(): ContentWriterReport {
    const startTime = Date.now()

    return {
      agentName: 'ContentWriterAgent',
      success: true,
      articlesGenerated: this.generatedArticles,
      articlesPublished: this.generatedArticles
        .filter((a) => a.status === 'published')
        .map((a) => ({
          articleId: a.id,
          shopifyArticleId: a.shopifyArticleId || '',
          title: a.title,
          slug: a.slug,
          url: `https://ayonne.skin/blogs/news/${a.slug}`,
          publishedAt: a.publishedAt || a.createdAt,
        })),
      qualityMetrics: {
        averageQualityScore:
          this.generatedArticles.length > 0
            ? this.generatedArticles.reduce(
                (sum, a) => sum + a.qualityScore.overall,
                0
              ) / this.generatedArticles.length
            : 0,
        averageWordCount:
          this.generatedArticles.length > 0
            ? this.generatedArticles.reduce((sum, a) => sum + a.wordCount, 0) /
              this.generatedArticles.length
            : 0,
        totalArticles: this.generatedArticles.length,
        publishedCount: this.generatedArticles.filter(
          (a) => a.status === 'published'
        ).length,
        draftCount: this.generatedArticles.filter((a) => a.status === 'draft')
          .length,
        keywordCoverage: this.calculateKeywordCoverage(),
        regionalCoverage: this.calculateRegionalCoverage(),
      },
      contentGaps: this.identifyContentGaps(),
      recommendations: this.generateRecommendations(),
      errors: [],
      warnings: [],
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private generateCityOutline(city: (typeof COLORADO_CITIES)[0]): ArticleOutline {
    return {
      introduction: {
        heading: 'Introduction',
        headingLevel: 2,
        keyPoints: [
          `Living in ${city.name} means dealing with unique skincare challenges.`,
          `At ${city.altitude.toLocaleString()} feet, your skin faces ${city.altitude > 5200 ? 'extreme' : 'significant'} dehydration.`,
          'This guide will help you build the perfect skincare routine for mountain living.',
        ],
        targetWordCount: 150,
      },
      sections: [
        {
          heading: `Understanding ${city.name}'s Climate Impact on Skin`,
          headingLevel: 2,
          keyPoints: city.uniqueFactors,
          targetWordCount: 300,
        },
        {
          heading: `Top Skincare Concerns for ${city.name} Residents`,
          headingLevel: 2,
          keyPoints: [
            'Chronic dehydration from low humidity',
            'UV damage from intense sun exposure',
            'Wind damage and barrier disruption',
            'Indoor heating effects in winter',
          ],
          targetWordCount: 400,
        },
        {
          heading: `Essential Products for ${city.name} Living`,
          headingLevel: 2,
          keyPoints: [
            'Hydrating cleansers that don\'t strip skin',
            'Hyaluronic acid serums for deep hydration',
            'Rich moisturizers with barrier-repair ingredients',
            'Broad-spectrum SPF 30+ daily',
          ],
          targetWordCount: 400,
        },
        {
          heading: `Your ${city.name} Skincare Routine`,
          headingLevel: 2,
          keyPoints: [
            'Morning routine for sun protection',
            'Evening routine for repair and hydration',
            'Weekly treatments for enhanced results',
          ],
          targetWordCount: 350,
        },
      ],
      conclusion: {
        heading: 'Get Personalized Recommendations',
        headingLevel: 2,
        keyPoints: [
          'Every skin is unique, and so is your response to altitude.',
          'Try our free AI skin analysis for personalized product recommendations.',
          `Take control of your ${city.name} skincare journey today.`,
        ],
        targetWordCount: 100,
      },
      faq: [
        {
          question: `Why is my skin so dry since moving to ${city.name}?`,
          answerBrief: `${city.name}'s ${city.altitude.toLocaleString()}-foot altitude means 20-30% less humidity than coastal areas, causing faster moisture evaporation from your skin.`,
        },
        {
          question: `What SPF should I use in ${city.name}?`,
          answerBrief:
            'At altitude, UV radiation is stronger. Use SPF 30-50 daily, even in winter.',
        },
        {
          question: 'How often should I moisturize in Colorado?',
          answerBrief:
            'Most residents benefit from moisturizing twice daily, with a heavier formula at night.',
        },
      ],
    }
  }

  private generateSeasonalOutline(
    season: string,
    themes: string[]
  ): ArticleOutline {
    const capitalizedSeason = season.charAt(0).toUpperCase() + season.slice(1)

    return {
      introduction: {
        heading: 'Introduction',
        headingLevel: 2,
        keyPoints: [
          `${capitalizedSeason} in Colorado brings unique skincare challenges.`,
          'Understanding how the season affects your skin is the first step to protection.',
        ],
        targetWordCount: 100,
      },
      sections: themes.slice(0, 4).map((theme, i) => ({
        heading: theme,
        headingLevel: 2 as const,
        keyPoints: [`Key information about ${theme.toLowerCase()}`],
        targetWordCount: 250,
      })),
      conclusion: {
        heading: 'Prepare Your Skin for the Season',
        headingLevel: 2,
        keyPoints: [
          `With the right approach, your skin can thrive during Colorado's ${season}.`,
          'Get personalized recommendations with our AI skin analysis.',
        ],
        targetWordCount: 100,
      },
    }
  }

  private generatePillarOutline(topic: string): ArticleOutline {
    return {
      introduction: {
        heading: 'Introduction',
        headingLevel: 2,
        keyPoints: [
          `Comprehensive guide to ${topic.replace(/_/g, ' ')} for Colorado residents.`,
          'Science-backed strategies for optimal skin health.',
        ],
        targetWordCount: 200,
      },
      sections: ARTICLE_TEMPLATES.pillarPage.sections.slice(1, -1).map((s) => ({
        heading: s,
        headingLevel: 2 as const,
        keyPoints: [`Detailed information about ${s.toLowerCase()}`],
        targetWordCount: 400,
      })),
      conclusion: {
        heading: 'Related Resources',
        headingLevel: 2,
        keyPoints: [
          'Explore our other guides for more skincare tips.',
          'Try our AI skin analysis for personalized recommendations.',
        ],
        targetWordCount: 150,
      },
      faq: [
        {
          question: `What is ${topic.replace(/_/g, ' ')} skincare?`,
          answerBrief: `Specialized skincare approaches designed for ${topic.replace(/_/g, ' ')} conditions.`,
        },
      ],
    }
  }

  private generateCitySEOMeta(city: (typeof COLORADO_CITIES)[0]): SEOMeta {
    return {
      title: `${city.name} Skincare Guide | ${city.altitude > 5200 ? 'High Altitude' : 'Colorado'} Tips`,
      description: `Expert skincare tips for ${city.name}, Colorado residents. Combat ${city.altitude.toLocaleString()}-foot altitude dryness with our science-backed guide and product recommendations.`,
    }
  }

  private generateRegionalFocus(city: (typeof COLORADO_CITIES)[0]): RegionalFocus {
    return {
      primaryCity: city.name,
      state: 'Colorado',
      metropolitanArea: city.metropolitanArea,
      population: city.population,
      climateFactors: {
        altitude: city.altitude > 6000 ? 'very_high' : 'high',
        humidity: 'very_low',
        averageTemperature: { winter: 32, summer: 85 },
        sunExposure: 'intense',
        primaryConcerns: ['dehydration', 'UV damage', 'barrier damage'],
      },
      localKeywords: city.primaryKeywords,
    }
  }

  private suggestProductsForCity(
    city: (typeof COLORADO_CITIES)[0]
  ): ProductMention[] {
    return [
      {
        productSlug: 'hyaluronic-acid-serum',
        productName: 'Hyaluronic Acid Serum',
        mentionContext: `Essential for ${city.name}'s low humidity environment`,
        linkType: 'contextual',
      },
      {
        productSlug: 'barrier-repair-cream',
        productName: 'Barrier Repair Cream',
        mentionContext: 'Protects against altitude-induced moisture loss',
        linkType: 'contextual',
      },
      {
        productSlug: 'daily-spf-moisturizer',
        productName: 'Daily SPF Moisturizer',
        mentionContext: 'Critical for intense Colorado sun exposure',
        linkType: 'direct',
      },
    ]
  }

  private suggestProductsForSeason(
    season: 'winter' | 'spring' | 'summer' | 'fall'
  ): ProductMention[] {
    const seasonProducts: Record<string, ProductMention[]> = {
      winter: [
        {
          productSlug: 'rich-night-cream',
          productName: 'Rich Night Cream',
          mentionContext: 'Combat indoor heating damage',
          linkType: 'contextual',
        },
        {
          productSlug: 'lip-treatment',
          productName: 'Hydrating Lip Treatment',
          mentionContext: 'Prevent winter chapping',
          linkType: 'contextual',
        },
      ],
      summer: [
        {
          productSlug: 'lightweight-spf',
          productName: 'Lightweight SPF',
          mentionContext: 'Daily sun protection without heaviness',
          linkType: 'direct',
        },
        {
          productSlug: 'after-sun-gel',
          productName: 'After Sun Gel',
          mentionContext: 'Soothe after outdoor activities',
          linkType: 'contextual',
        },
      ],
      spring: [
        {
          productSlug: 'gentle-exfoliant',
          productName: 'Gentle Exfoliant',
          mentionContext: 'Remove winter buildup',
          linkType: 'contextual',
        },
      ],
      fall: [
        {
          productSlug: 'hydrating-serum',
          productName: 'Hydrating Serum',
          mentionContext: 'Prep skin for winter dryness',
          linkType: 'contextual',
        },
      ],
    }
    return seasonProducts[season] || []
  }

  private generateInternalLinks(type: string): ArticleBrief['internalLinks'] {
    const baseLinks = [
      {
        targetUrl: 'https://ai.ayonne.skin/skin-analysis',
        anchorText: 'free AI skin analysis',
        context: 'CTA for personalized recommendations',
      },
      {
        targetUrl: 'https://ai.ayonne.skin/guides/skin-types',
        anchorText: 'skin type guide',
        context: 'Educational link',
      },
      {
        targetUrl: 'https://ayonne.skin/collections/all',
        anchorText: 'skincare products',
        context: 'Product collection link',
      },
    ]

    if (type === 'city_landing') {
      baseLinks.push({
        targetUrl: 'https://ai.ayonne.skin/skincare-denver-colorado',
        anchorText: 'Denver skincare guide',
        context: 'Related regional content',
      })
    }

    return baseLinks
  }

  private generateStructuredData(brief: ArticleBrief): ArticleStructuredData {
    return {
      '@type': brief.contentType === 'how_to' ? 'HowTo' : 'BlogPosting',
      headline: brief.title,
      description: brief.seoMeta.description,
      author: {
        '@type': 'Organization',
        name: 'Ayonne Skincare',
        url: 'https://ayonne.skin',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Ayonne Skincare',
        logo: {
          '@type': 'ImageObject',
          url: 'https://ayonne.skin/logo.png',
        },
      },
    }
  }

  private formatOutline(outline: ArticleOutline): string {
    let result = `Introduction:\n${outline.introduction.keyPoints.join('\n')}\n\n`
    for (const section of outline.sections) {
      result += `${'#'.repeat(section.headingLevel)} ${section.heading}\n`
      result += section.keyPoints.join('\n') + '\n\n'
    }
    result += `Conclusion:\n${outline.conclusion.keyPoints.join('\n')}`
    if (outline.faq) {
      result += '\n\nFAQ:\n'
      for (const faq of outline.faq) {
        result += `Q: ${faq.question}\nA: ${faq.answerBrief}\n\n`
      }
    }
    return result
  }

  private formatFAQSection(faqs: ArticleOutline['faq']): string {
    if (!faqs) return ''
    return `
<section class="faq" itemscope itemtype="https://schema.org/FAQPage">
  <h2>Frequently Asked Questions</h2>
  ${faqs
    .map(
      (faq) => `
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">${faq.question}</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">${faq.answerBrief}</p>
    </div>
  </div>`
    )
    .join('\n')}
</section>`
  }

  private countWords(content: string): number {
    return content
      .replace(/<[^>]*>/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  private getUpcomingSeason(month: number): string {
    if (month >= 11 || month <= 2) return 'winter'
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    return 'fall'
  }

  private calculateKeywordCoverage(): number {
    const coveredKeywords = new Set<string>()
    for (const article of this.generatedArticles) {
      const brief = this.contentBriefs.find((b) => b.id === article.briefId)
      if (brief) {
        coveredKeywords.add(brief.targetKeyword)
        brief.secondaryKeywords.forEach((k) => coveredKeywords.add(k))
      }
    }
    return Math.round((coveredKeywords.size / COLORADO_KEYWORDS.length) * 100)
  }

  private calculateRegionalCoverage(): Record<string, number> {
    const coverage: Record<string, number> = {}
    for (const city of COLORADO_CITIES) {
      const cityArticles = this.generatedArticles.filter((a) =>
        a.slug.includes(city.slug)
      )
      coverage[city.name] = cityArticles.length
    }
    return coverage
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const contentWriterAgent = new ContentWriterAgent()
