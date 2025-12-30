# Ayonne SEO Multi-Agent System

An autonomous SEO optimization system that runs daily to analyze and improve organic rankings and AI search visibility for Ayonne skincare.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run dry (no changes)
python -m seo_agents.run --config ../config/seo.yaml --dry-run

# Run live
python -m seo_agents.run --config ../config/seo.yaml
```

## Architecture

The system uses 14 specialized agents coordinated by the SEO Commander:

```
GitHub Actions (Daily 06:00 UTC)
         │
         ▼
   SEO Commander
         │
   ┌─────┴─────┐
   ▼           ▼
 Agents     Agents
   │           │
   └─────┬─────┘
         ▼
   Task Queue
         │
         ▼
   Executor
         │
         ▼
   Validators
         │
    ┌────┴────┐
    ▼         ▼
   PR      Report
```

## Agents

| Agent | Purpose |
|-------|---------|
| Technical Auditor | Robots, sitemaps, canonicals |
| CWV Agent | Core Web Vitals (PSI API) |
| Schema Agent | JSON-LD structured data |
| Internal Linking | Link graph, orphan pages |
| Keyword Mapper | Keywords, cannibalization |
| Competitor Intel | Content gaps |
| Content Refresh | Thin content, E-E-A-T |
| E-E-A-T Agent | Trust signals |
| AI Readiness | LLM optimization |
| Snippet Agent | Featured snippets, PAA |
| Cannibalization | Duplicates, pruning |
| CRO Agent | Conversions, CTAs |
| Monitoring | Anomaly detection |

## Daily Loop

1. **CRAWL** - Fetch sitemaps, crawl pages
2. **ANALYZE** - Run all agents
3. **DECIDE** - Prioritize tasks (max 5/day)
4. **EXECUTE** - Apply changes or generate patches
5. **VALIDATE** - Quality gate checks
6. **MEASURE** - Log metrics
7. **LEARN** - Update baselines

## Configuration

Edit `config/seo.yaml`:

```yaml
domains:
  primary: "ayonne.skin"
  app: "ai.ayonne.skin"

limits:
  max_changes_per_day: 5
  max_pages_crawl: 100

forbidden_words:
  - cure
  - treat
  - heal
```

## Output

```
runs/YYYY-MM-DD/
├── crawl_data.json
├── agent_reports/
├── all_tasks.json
├── execution_plan.json
└── summary.json

reports/
├── summary.md
├── topical_map.json
├── backlog.json
└── patches/
```

## GitHub Actions

The workflow (`.github/workflows/daily-seo.yml`):
- Runs daily at 06:00 UTC
- Manual trigger via workflow_dispatch
- Creates PR for changes
- Includes dry-run option

## Safety

- Max 5 changes per day
- High-risk tasks blocked (require manual review)
- Forbidden words validation
- JSON-LD syntax validation
- No accidental noindex check

## Secrets (Optional)

- `PSI_API_KEY` - PageSpeed Insights (increases quota from 25 to 400/day)

## License

Proprietary - Ayonne Skincare
