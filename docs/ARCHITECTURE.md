# Ayonne SEO Multi-Agent System Architecture

## Overview

This document describes the autonomous SEO agent system for Ayonne (ayonne.skin and ai.ayonne.skin). The system runs daily via GitHub Actions, analyzing both sites and proposing high-impact improvements through pull requests.

## Assumptions

1. **Shopify CMS**: The main store (ayonne.skin) uses Shopify - we cannot directly modify CMS content, so we generate "patch packs" as recommendations
2. **Next.js App**: ai.ayonne.skin is in this repo and can be directly modified
3. **No Paid APIs Required**: Uses only free APIs (Google PSI, sitemap parsing, HTML scraping)
4. **Rate Limits**: Respect external API rate limits (1 req/sec for PageSpeed Insights)
5. **Conservative Changes**: Maximum 5 changes per day unless critical issues found

## Architecture Diagram

```
                            +------------------+
                            |  GitHub Actions  |
                            |  (Daily Trigger) |
                            +--------+---------+
                                     |
                                     v
                            +------------------+
                            |  SEO Commander   |
                            |  (Orchestrator)  |
                            +--------+---------+
                                     |
         +---------------------------+---------------------------+
         |           |           |           |           |       |
         v           v           v           v           v       v
   +-----------+ +---------+ +----------+ +--------+ +-------+ +----+
   | Technical | |   CWV   | |  Schema  | | Int.   | | KW &  | | .. |
   |   Audit   | |  Agent  | |  Agent   | | Links  | | Intent| |    |
   +-----------+ +---------+ +----------+ +--------+ +-------+ +----+
         |           |           |           |           |       |
         +---------------------------+---------------------------+
                                     |
                                     v
                            +------------------+
                            |   Task Queue     |
                            | (Priority+Risk)  |
                            +--------+---------+
                                     |
                                     v
                            +------------------+
                            |    Executor      |
                            |  (File Changes)  |
                            +--------+---------+
                                     |
                                     v
                            +------------------+
                            |   Validators     |
                            | (Quality Gates)  |
                            +--------+---------+
                                     |
                  +------------------+------------------+
                  |                                     |
           (Pass) v                              (Fail) v
        +-----------------+                   +------------------+
        |  Git Commit +   |                   |  Rollback +      |
        |  Open PR        |                   |  Alert Report    |
        +-----------------+                   +------------------+
```

## Agent Definitions

### 1. SEO Commander (Orchestrator)
**File**: `seo_agents/orchestrator.py`

**Responsibilities**:
- Initialize all agents
- Coordinate daily execution loop
- Aggregate findings from all agents
- Prioritize tasks by impact and risk
- Enforce max 5 changes/day limit
- Generate summary reports

**Inputs**:
- Configuration (domains, thresholds, forbidden words)
- Previous run state

**Outputs**:
- Prioritized task queue
- Execution log
- Summary report

**KPIs**:
- Tasks completed per run
- Average task priority score
- Rollback rate

**Risk Checks**:
- Abort if >3 critical errors from any agent
- Require human review if >5 pages need modification

---

### 2. Technical SEO Auditor
**File**: `seo_agents/agents/technical_auditor.py`

**Responsibilities**:
- Parse robots.txt and sitemap.xml
- Check indexation status signals
- Verify canonical tags
- Detect redirect chains
- Find broken internal links
- Check meta robots tags

**Inputs**:
- Domain URL
- Sitemap URL

**Outputs**:
- List of technical issues with severity
- Recommended fixes

**KPIs**:
- Pages crawled
- Issues found by severity
- Fix implementation rate

**Risk Checks**:
- Never suggest removing pages from index without human review
- Flag canonical conflicts for manual review

---

### 3. Core Web Vitals Agent
**File**: `seo_agents/agents/cwv_agent.py`

**Responsibilities**:
- Test key pages via PageSpeed Insights API (free tier)
- Track LCP, FID/INP, CLS scores
- Identify performance bottlenecks
- Suggest specific optimizations

**Inputs**:
- List of priority URLs (homepage, key product pages, landing pages)

**Outputs**:
- CWV scores per page
- Performance recommendations
- Trend comparison with previous runs

**KPIs**:
- Average LCP/CLS/INP scores
- Pages passing Core Web Vitals
- Score improvements over time

**Risk Checks**:
- Only suggest code changes that don't break functionality
- Limit to 2 performance-related changes per day

---

### 4. Schema Agent
**File**: `seo_agents/agents/schema_agent.py`

**Responsibilities**:
- Audit existing structured data
- Generate missing schema (Product, FAQPage, Organization, BreadcrumbList, WebSite, HowTo)
- Validate JSON-LD syntax
- Ensure schema matches page content

**Inputs**:
- Page HTML
- Product data from Shopify mapping

**Outputs**:
- Schema validation report
- New/updated JSON-LD snippets
- Implementation patches

**KPIs**:
- Schema coverage %
- Validation errors found
- Rich result eligibility

**Risk Checks**:
- Validate all JSON-LD before committing
- Never add misleading schema data

---

### 5. Internal Linking Architect
**File**: `seo_agents/agents/internal_linking.py`

**Responsibilities**:
- Map site structure and link graph
- Calculate PageRank distribution
- Identify orphan pages
- Suggest contextual internal links
- Maintain breadcrumb structure

**Inputs**:
- Crawled page data
- Content topics/clusters

**Outputs**:
- Link graph analysis
- Orphan page report
- Suggested internal links

**KPIs**:
- Average crawl depth
- Orphan pages count
- Internal link density

**Risk Checks**:
- Don't create circular link patterns
- Limit to 3 new links per page

---

### 6. Keyword & Intent Mapper
**File**: `seo_agents/agents/keyword_mapper.py`

**Responsibilities**:
- Maintain keyword-to-page mapping
- Identify keyword cannibalization
- Map search intent (informational, transactional, navigational)
- Track keyword clusters

**Inputs**:
- Page content
- Historical keyword data (if available)

**Outputs**:
- Keyword map
- Cannibalization report
- Intent classification

**KPIs**:
- Keywords mapped
- Cannibalization issues found
- Intent coverage per cluster

**Risk Checks**:
- Flag significant keyword changes for review

---

### 7. Competitor Intelligence Agent
**File**: `seo_agents/agents/competitor_intel.py`

**Responsibilities**:
- Track top competitors for target keywords
- Analyze competitor content structure
- Identify content gaps
- Monitor SERP feature presence

**Target Clusters**:
- Anti-aging (retinol, collagen, vitamin C)
- Brightening (niacinamide, dark spots)
- Hydration (hyaluronic acid, moisturizers)
- Exfoliation (glycolic acid)
- Eye care (dark circles, fine lines)

**Inputs**:
- Target keywords
- Competitor domains

**Outputs**:
- Competitor content analysis
- Gap report
- SERP feature opportunities

**KPIs**:
- Competitors tracked
- Content gaps identified
- Feature parity score

**Risk Checks**:
- Respect robots.txt of competitor sites
- Rate limit requests (1/sec)

---

### 8. Content Refresh Agent
**File**: `seo_agents/agents/content_refresh.py`

**Responsibilities**:
- Identify outdated content
- Suggest content improvements for E-E-A-T
- Ensure accurate, non-medical claims
- Add missing sections (FAQs, comparisons)

**Inputs**:
- Page content
- Last modified dates
- Performance data

**Outputs**:
- Content refresh recommendations
- Updated content patches

**KPIs**:
- Pages refreshed
- Content quality scores
- E-E-A-T compliance rate

**Risk Checks**:
- Scan for forbidden medical claims
- Require disclaimer for skincare advice

---

### 9. E-E-A-T Agent
**File**: `seo_agents/agents/eeat_agent.py`

**Responsibilities**:
- Audit trust signals
- Check author attribution
- Verify source citations
- Ensure policy pages exist (privacy, terms, refunds)
- Review product safety information

**Inputs**:
- Site pages
- Policy page list

**Outputs**:
- E-E-A-T audit report
- Missing trust signal recommendations

**KPIs**:
- Trust signal coverage
- Policy page completeness
- Citation presence

**Risk Checks**:
- Flag missing medical disclaimers

---

### 10. AI Readiness Agent
**File**: `seo_agents/agents/ai_readiness.py`

**Responsibilities**:
- Optimize for LLM extractability
- Ensure "answer-first" content structure
- Add entity clarity markers
- Format for AI shopping integration
- Maintain llms.txt

**Inputs**:
- Page content
- Product catalog

**Outputs**:
- AI readiness score
- Optimization recommendations
- Updated llms.txt

**KPIs**:
- AI readiness score
- Answer block coverage
- Entity clarity rating

**Risk Checks**:
- Preserve human readability

---

### 11. Snippet & PAA Agent
**File**: `seo_agents/agents/snippet_agent.py`

**Responsibilities**:
- Identify snippet opportunities
- Format content for featured snippets
- Create PAA-targeted Q&A blocks
- Add HowTo schema where appropriate

**Inputs**:
- Page content
- Target keywords

**Outputs**:
- Snippet-optimized content
- PAA question suggestions
- HowTo schema patches

**KPIs**:
- Snippet opportunities identified
- PAA-formatted content blocks
- HowTo schema added

**Risk Checks**:
- Maintain content accuracy

---

### 12. Cannibalization & Pruning Agent
**File**: `seo_agents/agents/cannibalization.py`

**Responsibilities**:
- Detect keyword cannibalization
- Identify thin/duplicate content
- Suggest merge/redirect/retire actions
- Track content consolidation

**Inputs**:
- All page content
- Keyword mappings

**Outputs**:
- Cannibalization report
- Prune recommendations

**KPIs**:
- Cannibalization issues found
- Pages pruned/merged
- Redirect implementations

**Risk Checks**:
- Never auto-delete content
- Require human approval for redirects

---

### 13. Conversion Rate Agent
**File**: `seo_agents/agents/cro_agent.py`

**Responsibilities**:
- Audit CTA placement
- Check trust blocks (reviews, guarantees)
- Analyze funnel pages
- Optimize form accessibility

**Inputs**:
- Page HTML
- Funnel configuration

**Outputs**:
- CRO audit report
- CTA recommendations
- Trust signal suggestions

**KPIs**:
- CTA coverage
- Trust block presence
- Form accessibility score

**Risk Checks**:
- Don't add spammy/aggressive CTAs

---

### 14. Monitoring & Alerts Agent
**File**: `seo_agents/agents/monitoring.py`

**Responsibilities**:
- Track crawl errors
- Monitor indexation changes
- Alert on rank drops (if GSC data available)
- Detect anomalies

**Inputs**:
- Previous run data
- Current crawl data

**Outputs**:
- Anomaly alerts
- Trend reports
- Health dashboard data

**KPIs**:
- Alerts generated
- False positive rate
- Issue detection time

**Risk Checks**:
- Don't alert on normal fluctuations

---

## Daily Execution Loop

```
1. CRAWL Phase (10 min)
   - Fetch sitemaps
   - Crawl key pages (limit 100/run)
   - Collect metadata

2. ANALYZE Phase (15 min)
   - Run all agents in parallel
   - Aggregate findings
   - Score by priority and risk

3. DECIDE Phase (5 min)
   - Filter to max 5 tasks
   - Validate against quality gates
   - Generate execution plan

4. EXECUTE Phase (10 min)
   - Apply file changes (ai.ayonne.skin)
   - Generate patches (ayonne.skin)
   - Run validators

5. VALIDATE Phase (5 min)
   - Check forbidden words
   - Validate JSON-LD
   - Verify no broken links
   - Confirm noindex not added

6. MEASURE Phase (5 min)
   - Log metrics
   - Update baselines
   - Compare with targets

7. LEARN Phase (5 min)
   - Store successful patterns
   - Update priority weights
   - Archive run data
```

## Priority & Risk Scoring

### Priority Score (1-100)
| Factor | Weight | Description |
|--------|--------|-------------|
| Traffic Impact | 30% | Estimated traffic affected |
| Technical Severity | 25% | Critical > High > Medium > Low |
| Quick Win | 20% | Easy to implement |
| Competitive Gap | 15% | Competitor has, we don't |
| Freshness | 10% | Time since last update |

### Risk Score (1-100)
| Factor | Weight | Description |
|--------|--------|-------------|
| Destructive | 40% | Removes content/pages |
| Untested | 25% | First time this change type |
| High Traffic | 20% | Affects popular pages |
| Schema Change | 15% | Modifies structured data |

### Decision Matrix
- Priority > 70, Risk < 30: Auto-execute
- Priority > 50, Risk < 50: Execute with extra validation
- Priority > 70, Risk > 50: Require manual review
- Risk > 70: Block execution, report only

## Quality Gates

### Pre-Commit Checks
1. **Forbidden Words Scan**
   ```python
   FORBIDDEN_WORDS = [
       "cure", "treat", "heal", "diagnose", "disease",
       "medical", "prescription", "doctor", "physician",
       "miracle", "guaranteed", "proven to"
   ]
   ```

2. **JSON-LD Validation**
   - Valid JSON syntax
   - Required properties present
   - URL formats correct

3. **Internal Link Check**
   - No broken links introduced
   - No orphan pages created

4. **Meta Tag Validation**
   - No accidental noindex
   - Canonical URLs valid
   - Title/description length OK

5. **Change Limit**
   - Max 5 files modified
   - If exceeded: report only, no commit

## File Outputs

### Run Artifacts (`/runs/YYYY-MM-DD/`)
- `crawl_data.json` - Raw crawl results
- `agent_reports/` - Individual agent outputs
- `tasks.json` - Prioritized task list
- `execution_log.json` - What was executed
- `validation_results.json` - Quality gate results

### Persistent Reports (`/reports/`)
- `summary.md` - Human-readable latest summary
- `metrics.json` - Historical metrics
- `topical_map.json` - Content cluster map
- `patches/` - Shopify patch recommendations
- `backlog.json` - Queued improvements

## Configuration (`/config/seo.yaml`)

```yaml
domains:
  primary: "ayonne.skin"
  app: "ai.ayonne.skin"

thresholds:
  cwv_lcp_good: 2500
  cwv_cls_good: 0.1
  cwv_inp_good: 200

limits:
  max_changes_per_day: 5
  max_pages_crawl: 100
  rate_limit_sec: 1

forbidden_words:
  - cure
  - treat
  - heal
  - diagnose
  # ... (full list in config)

competitors:
  - theordinary.com
  - cerave.com
  - paulaschoice.com

clusters:
  anti_aging:
    pillar: "anti-aging-skincare"
    keywords:
      - retinol
      - collagen
      - vitamin c serum
      - anti wrinkle
  brightening:
    pillar: "skin-brightening"
    keywords:
      - niacinamide
      - dark spot corrector
      - vitamin c
  # ... more clusters
```

## Measurement & KPIs

### Automated Collection
| Metric | Source | Frequency |
|--------|--------|-----------|
| CWV Scores | PageSpeed Insights API | Daily |
| Crawl Depth | Internal crawler | Daily |
| Schema Coverage | Schema validation | Daily |
| Internal Links | Link graph analysis | Daily |
| Content Quality | Readability + E-E-A-T score | Daily |

### Manual/API Integration (Optional)
| Metric | Source | Frequency |
|--------|--------|-----------|
| Organic Traffic | GSC API (if configured) | Weekly |
| Impressions | GSC API | Weekly |
| Avg Position | GSC API | Weekly |
| Index Coverage | GSC API | Weekly |

### Dashboard Metrics
- Overall SEO Health Score (0-100)
- Tasks completed this week
- Pages optimized
- Schema coverage %
- CWV pass rate
- Content freshness score

## Rollback & Recovery

### Automatic Rollback Triggers
- Validation fails
- Build breaks
- Critical errors in execution

### Recovery Process
1. Git revert to previous state
2. Log rollback reason
3. Generate incident report
4. Flag for human review

## Security & Permissions

### GitHub Actions
- `contents: write` - Create branches, commits
- `pull-requests: write` - Open PRs
- Uses `GITHUB_TOKEN` (auto-provided)

### Optional Secrets
- `PSI_API_KEY` - PageSpeed Insights (optional, increases quota)
- `GSC_CREDENTIALS` - Google Search Console (optional)

### Rate Limiting
- All external APIs: 1 request/second default
- PageSpeed Insights: 25 queries/day (free tier)
- Competitor scraping: Respects robots.txt

## Getting Started

### Local Development
```bash
# Install dependencies
cd seo_agents
pip install -r requirements.txt

# Run locally
python -m seo_agents.run --config ../config/seo.yaml

# Dry run (no commits)
python -m seo_agents.run --config ../config/seo.yaml --dry-run
```

### GitHub Actions
The workflow runs daily at 06:00 UTC. Manual runs available via workflow_dispatch.
