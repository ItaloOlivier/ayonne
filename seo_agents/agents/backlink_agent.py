"""
Backlink Analysis Agent

Analyzes backlink profile and identifies link-building opportunities.
Since we don't have access to paid APIs (Ahrefs, Majestic), this agent:
1. Analyzes internal backlink structure
2. Identifies potential link-building targets from content
3. Tracks existing backlinks from web mentions
4. Suggests outreach opportunities
"""

import re
import time
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from urllib.parse import urlparse, urljoin

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


@dataclass
class BacklinkOpportunity:
    """A potential backlink opportunity."""
    source_type: str  # directory, guest_post, resource_page, mention, competitor
    target_url: str
    anchor_text_suggestion: str
    priority: int
    difficulty: str  # easy, medium, hard
    notes: str
    discovered_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class ExistingBacklink:
    """An existing backlink."""
    source_url: str
    target_url: str
    anchor_text: str
    is_dofollow: bool
    discovered_at: str
    last_checked: str


class BacklinkAnalysisAgent(BaseAgent):
    """
    Analyzes backlink profile and identifies opportunities.

    Capabilities:
    - Analyze internal link equity distribution
    - Identify pages that should receive more internal links
    - Suggest directory submission opportunities
    - Track competitor backlinks (manual process)
    - Generate outreach templates
    """

    # Common directories for skincare/beauty businesses
    DIRECTORY_OPPORTUNITIES = [
        {
            'name': 'Google Business Profile',
            'url': 'https://business.google.com',
            'difficulty': 'easy',
            'priority': 95,
            'notes': 'Essential for local SEO'
        },
        {
            'name': 'Bing Places',
            'url': 'https://www.bingplaces.com',
            'difficulty': 'easy',
            'priority': 85,
            'notes': 'Free business listing'
        },
        {
            'name': 'Apple Maps',
            'url': 'https://mapsconnect.apple.com',
            'difficulty': 'easy',
            'priority': 80,
            'notes': 'Important for iOS users'
        },
        {
            'name': 'Yelp Business',
            'url': 'https://biz.yelp.com',
            'difficulty': 'easy',
            'priority': 75,
            'notes': 'Good for reviews and citations'
        },
        {
            'name': 'Better Business Bureau',
            'url': 'https://www.bbb.org',
            'difficulty': 'medium',
            'priority': 70,
            'notes': 'Trust signal'
        },
        {
            'name': 'Crunchbase',
            'url': 'https://www.crunchbase.com',
            'difficulty': 'easy',
            'priority': 65,
            'notes': 'Good for company profile'
        },
        {
            'name': 'LinkedIn Company Page',
            'url': 'https://www.linkedin.com/company/',
            'difficulty': 'easy',
            'priority': 90,
            'notes': 'Professional presence'
        },
        {
            'name': 'Product Hunt',
            'url': 'https://www.producthunt.com',
            'difficulty': 'medium',
            'priority': 60,
            'notes': 'Good for AI skincare tools'
        },
    ]

    # Colorado-specific directories
    COLORADO_DIRECTORIES = [
        {
            'name': 'Colorado Business Directory',
            'url': 'https://www.coloradobusinessdirectory.com',
            'difficulty': 'easy',
            'priority': 70,
            'notes': 'Regional authority'
        },
        {
            'name': 'Denver Chamber of Commerce',
            'url': 'https://denverchamber.org',
            'difficulty': 'medium',
            'priority': 75,
            'notes': 'Local business credibility'
        },
        {
            'name': 'Boulder Chamber',
            'url': 'https://boulderchamber.com',
            'difficulty': 'medium',
            'priority': 70,
            'notes': 'Boulder market presence'
        },
    ]

    # Beauty/skincare specific directories
    INDUSTRY_DIRECTORIES = [
        {
            'name': 'Beauty Independent',
            'url': 'https://www.beautyindependent.com',
            'difficulty': 'hard',
            'priority': 80,
            'notes': 'Industry authority site'
        },
        {
            'name': 'Cosmetics Business',
            'url': 'https://www.cosmeticsbusiness.com',
            'difficulty': 'hard',
            'priority': 75,
            'notes': 'Trade publication'
        },
    ]

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.opportunities: List[BacklinkOpportunity] = []
        self.internal_link_analysis: Dict = {}
        self.content_gaps_for_links: List[str] = []

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """
        Analyze backlink profile and identify opportunities.

        Args:
            crawl_data: Dictionary of crawled page data

        Returns:
            AgentResult with backlink analysis and tasks
        """
        start_time = time.time()
        result = AgentResult(
            agent_name=self.name,
            success=True,
            tasks=[],
            metrics={},
            errors=[],
            warnings=[]
        )

        self.log_info("Starting backlink analysis...")

        try:
            # Phase 1: Analyze internal link equity
            self._analyze_internal_links(crawl_data, result)

            # Phase 2: Identify directory opportunities
            self._identify_directory_opportunities(result)

            # Phase 3: Analyze content for linkable assets
            self._analyze_linkable_assets(crawl_data, result)

            # Phase 4: Generate outreach suggestions
            self._generate_outreach_suggestions(crawl_data, result)

            # Phase 5: Check for unlinked brand mentions (placeholder)
            self._check_brand_mentions(result)

            # Calculate metrics
            result.metrics = self.get_kpis()
            result.summary = self._generate_summary(result)

        except Exception as e:
            result.success = False
            result.errors.append(f"Backlink analysis failed: {str(e)}")
            self.log_error(f"Analysis failed: {e}")

        result.execution_time = time.time() - start_time
        self.log_info(f"Analysis complete in {result.execution_time:.2f}s")

        return result

    def _analyze_internal_links(self, crawl_data: Dict, result: AgentResult) -> None:
        """Analyze internal link distribution."""
        self.log_info("Analyzing internal link structure...")

        page_link_counts: Dict[str, int] = {}
        money_pages = self._get_money_pages()

        for url, data in crawl_data.items():
            if not isinstance(data, dict):
                continue

            internal_links = data.get('internal_links', [])
            for link in internal_links:
                target = link.get('href', link) if isinstance(link, dict) else link
                if target:
                    page_link_counts[target] = page_link_counts.get(target, 0) + 1

        # Find money pages with low internal links
        for money_page in money_pages:
            link_count = page_link_counts.get(money_page, 0)
            if link_count < 3:
                result.tasks.append(self.create_task(
                    description=f"Add internal links to money page: {money_page} (currently {link_count} links)",
                    priority=TaskPriority.HIGH.value,
                    risk=TaskRisk.LOW.value,
                    action_type="report",
                    target_url=money_page,
                    metadata={
                        'current_links': link_count,
                        'recommended_links': 5,
                        'page_type': 'money_page'
                    }
                ))

        self.internal_link_analysis = {
            'total_pages': len(crawl_data),
            'pages_analyzed': len(page_link_counts),
            'orphan_pages': sum(1 for c in page_link_counts.values() if c == 0),
            'money_pages_underlinked': sum(
                1 for mp in money_pages if page_link_counts.get(mp, 0) < 3
            )
        }

    def _get_money_pages(self) -> List[str]:
        """Get list of money pages (high-value conversion pages)."""
        primary_domain = self.get_config('domains.primary', 'ayonne.skin')
        app_domain = self.get_config('domains.app', 'ai.ayonne.skin')

        return [
            f"https://{primary_domain}/",
            f"https://{primary_domain}/collections/all",
            f"https://{primary_domain}/collections/anti-aging",
            f"https://{primary_domain}/collections/serums",
            f"https://{primary_domain}/collections/moisturizers",
            f"https://{app_domain}/",
            f"https://{app_domain}/skin-analysis",
            f"https://{app_domain}/skin-age-test",
        ]

    def _identify_directory_opportunities(self, result: AgentResult) -> None:
        """Identify directory submission opportunities."""
        self.log_info("Identifying directory opportunities...")

        all_directories = (
            self.DIRECTORY_OPPORTUNITIES +
            self.COLORADO_DIRECTORIES +
            self.INDUSTRY_DIRECTORIES
        )

        for directory in all_directories:
            opportunity = BacklinkOpportunity(
                source_type='directory',
                target_url=directory['url'],
                anchor_text_suggestion='Ayonne Skincare',
                priority=directory['priority'],
                difficulty=directory['difficulty'],
                notes=directory['notes']
            )
            self.opportunities.append(opportunity)

            # Create task for high-priority directories
            if directory['priority'] >= 80:
                result.tasks.append(self.create_task(
                    description=f"Submit to {directory['name']}: {directory['notes']}",
                    priority=directory['priority'],
                    risk=TaskRisk.MINIMAL.value,
                    action_type="report",
                    target_url=directory['url'],
                    metadata={
                        'directory_name': directory['name'],
                        'difficulty': directory['difficulty'],
                        'type': 'directory_submission'
                    }
                ))

    def _analyze_linkable_assets(self, crawl_data: Dict, result: AgentResult) -> None:
        """Identify content that could attract backlinks."""
        self.log_info("Analyzing linkable assets...")

        linkable_content_types = [
            'original research',
            'infographic',
            'tool',
            'calculator',
            'guide',
            'checklist',
            'template'
        ]

        # Check for existing linkable assets
        for url, data in crawl_data.items():
            if not isinstance(data, dict):
                continue

            title = data.get('title', '').lower()
            content = data.get('content', '').lower()

            # Check if page is a linkable asset
            for asset_type in linkable_content_types:
                if asset_type in title or asset_type in content:
                    result.tasks.append(self.create_task(
                        description=f"Promote linkable asset: {url} (type: {asset_type})",
                        priority=TaskPriority.MEDIUM.value,
                        risk=TaskRisk.MINIMAL.value,
                        action_type="report",
                        target_url=url,
                        metadata={
                            'asset_type': asset_type,
                            'promotion_channels': ['social', 'outreach', 'directories']
                        }
                    ))
                    break

        # Suggest creating new linkable assets
        suggested_assets = [
            {
                'type': 'tool',
                'title': 'Colorado Altitude Skincare Calculator',
                'description': 'Interactive tool to calculate skincare adjustments based on altitude',
                'priority': 85
            },
            {
                'type': 'guide',
                'title': 'Ultimate Guide to High-Altitude Skincare',
                'description': 'Comprehensive pillar content that can attract links',
                'priority': 80
            },
            {
                'type': 'infographic',
                'title': 'How Altitude Affects Your Skin (Infographic)',
                'description': 'Visual content for sharing and embedding',
                'priority': 75
            },
        ]

        for asset in suggested_assets:
            result.tasks.append(self.create_task(
                description=f"Create linkable asset: {asset['title']}",
                priority=asset['priority'],
                risk=TaskRisk.LOW.value,
                action_type="report",
                metadata={
                    'asset_type': asset['type'],
                    'description': asset['description'],
                    'expected_link_potential': 'high'
                }
            ))

    def _generate_outreach_suggestions(self, crawl_data: Dict, result: AgentResult) -> None:
        """Generate outreach suggestions for link building."""
        self.log_info("Generating outreach suggestions...")

        outreach_targets = [
            {
                'type': 'guest_post',
                'target': 'Colorado lifestyle blogs',
                'pitch': 'Expert article on skincare for Colorado climate',
                'priority': 70
            },
            {
                'type': 'resource_page',
                'target': 'Skincare resource pages',
                'pitch': 'AI skin analyzer tool as a resource',
                'priority': 65
            },
            {
                'type': 'podcast',
                'target': 'Beauty/wellness podcasts',
                'pitch': 'Discuss altitude effects on skin',
                'priority': 60
            },
            {
                'type': 'expert_roundup',
                'target': 'Skincare expert roundups',
                'pitch': 'Contribute expert quote on dry climate skincare',
                'priority': 55
            },
        ]

        for target in outreach_targets:
            result.tasks.append(self.create_task(
                description=f"Outreach opportunity: {target['type']} - {target['target']}",
                priority=target['priority'],
                risk=TaskRisk.LOW.value,
                action_type="report",
                metadata={
                    'outreach_type': target['type'],
                    'pitch': target['pitch'],
                    'status': 'suggested'
                }
            ))

    def _check_brand_mentions(self, result: AgentResult) -> None:
        """Check for unlinked brand mentions (placeholder for future API integration)."""
        self.log_info("Checking for brand mentions...")

        # This would integrate with a brand mention monitoring service
        # For now, add a task to set up monitoring
        result.tasks.append(self.create_task(
            description="Set up brand mention monitoring for 'Ayonne' and 'ayonne.skin'",
            priority=TaskPriority.MEDIUM.value,
            risk=TaskRisk.MINIMAL.value,
            action_type="report",
            metadata={
                'brand_terms': ['Ayonne', 'ayonne.skin', 'Ayonne Skincare'],
                'monitoring_tools': ['Google Alerts', 'Mention', 'Brand24'],
                'action': 'Convert unlinked mentions to backlinks'
            }
        ))

    def _generate_summary(self, result: AgentResult) -> str:
        """Generate analysis summary."""
        total_opportunities = len(self.opportunities)
        directory_count = sum(1 for o in self.opportunities if o.source_type == 'directory')

        return (
            f"Backlink analysis complete. "
            f"Found {total_opportunities} opportunities "
            f"({directory_count} directories, "
            f"{self.internal_link_analysis.get('money_pages_underlinked', 0)} underlinked money pages). "
            f"Generated {len(result.tasks)} actionable tasks."
        )

    def get_kpis(self) -> Dict[str, Any]:
        """Return agent KPIs."""
        return {
            'total_opportunities': len(self.opportunities),
            'directory_opportunities': sum(
                1 for o in self.opportunities if o.source_type == 'directory'
            ),
            'easy_opportunities': sum(
                1 for o in self.opportunities if o.difficulty == 'easy'
            ),
            'high_priority_opportunities': sum(
                1 for o in self.opportunities if o.priority >= 75
            ),
            'internal_link_issues': self.internal_link_analysis.get(
                'money_pages_underlinked', 0
            ),
            'orphan_pages': self.internal_link_analysis.get('orphan_pages', 0),
        }

    def get_opportunities_report(self) -> Dict:
        """Get detailed opportunities report."""
        return {
            'opportunities': [
                {
                    'source_type': o.source_type,
                    'target_url': o.target_url,
                    'anchor_text': o.anchor_text_suggestion,
                    'priority': o.priority,
                    'difficulty': o.difficulty,
                    'notes': o.notes,
                    'discovered_at': o.discovered_at
                }
                for o in self.opportunities
            ],
            'internal_analysis': self.internal_link_analysis,
            'summary': {
                'total': len(self.opportunities),
                'by_type': {
                    'directory': sum(1 for o in self.opportunities if o.source_type == 'directory'),
                    'guest_post': sum(1 for o in self.opportunities if o.source_type == 'guest_post'),
                    'resource_page': sum(1 for o in self.opportunities if o.source_type == 'resource_page'),
                    'mention': sum(1 for o in self.opportunities if o.source_type == 'mention'),
                },
                'by_difficulty': {
                    'easy': sum(1 for o in self.opportunities if o.difficulty == 'easy'),
                    'medium': sum(1 for o in self.opportunities if o.difficulty == 'medium'),
                    'hard': sum(1 for o in self.opportunities if o.difficulty == 'hard'),
                }
            }
        }
