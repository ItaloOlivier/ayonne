"""
Shared Keywords Integration

Provides Python SEO agents access to the shared keyword database
used by both Python and TypeScript systems.

This enables:
- Reading keyword priorities from TypeScript Content Writer
- Updating keyword performance from SEO crawl data
- Syncing new keywords discovered during analysis
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


@dataclass
class Keyword:
    """Keyword data structure."""
    keyword: str
    priority: int
    volume: str  # high, medium, low
    difficulty: str  # high, medium, low
    intent: str  # commercial, informational, navigational, transactional
    status: str = 'active'  # active, paused, completed
    last_targeted: Optional[str] = None
    performance: Optional[Dict[str, Any]] = None


@dataclass
class TopicCluster:
    """Topic cluster structure."""
    pillar: str
    clusters: List[str] = field(default_factory=list)


class SharedKeywordsManager:
    """
    Manages the shared keywords database for Python SEO agents.

    Usage:
        manager = SharedKeywordsManager()
        keywords = manager.get_priority_keywords(limit=10)
        manager.update_keyword_performance('denver skincare', avg_position=5.2, clicks=150)
        manager.sync_keywords([{'keyword': 'new keyword', 'priority': 60}])
    """

    def __init__(self, keywords_path: Optional[str] = None, logger: Optional[logging.Logger] = None):
        self.logger = logger or logging.getLogger(__name__)

        # Default path: project_root/.business-os/data/shared-keywords.json
        if keywords_path:
            self.keywords_path = Path(keywords_path)
        else:
            project_root = Path(__file__).parent.parent.parent
            self.keywords_path = project_root / '.business-os' / 'data' / 'shared-keywords.json'

        self._data: Optional[Dict] = None

    def _load(self) -> Dict:
        """Load keywords data from file."""
        if self._data is not None:
            return self._data

        try:
            with open(self.keywords_path, 'r') as f:
                self._data = json.load(f)
                self.logger.info(f"Loaded {self._count_keywords()} keywords from {self.keywords_path}")
        except FileNotFoundError:
            self.logger.warning(f"Keywords file not found: {self.keywords_path}")
            self._data = self._get_default_data()
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in keywords file: {e}")
            self._data = self._get_default_data()

        return self._data

    def _save(self) -> None:
        """Save keywords data to file."""
        if self._data is None:
            return

        self._data['lastUpdated'] = datetime.utcnow().isoformat() + 'Z'

        # Ensure directory exists
        self.keywords_path.parent.mkdir(parents=True, exist_ok=True)

        with open(self.keywords_path, 'w') as f:
            json.dump(self._data, f, indent=2)

        self.logger.info(f"Saved keywords to {self.keywords_path}")

    def _count_keywords(self) -> int:
        """Count total keywords."""
        data = self._load()
        return sum(
            len(data['keywords'].get(tier, []))
            for tier in ['primary', 'secondary', 'longtail']
        )

    def _get_default_data(self) -> Dict:
        """Return default empty data structure."""
        return {
            'version': '1.0.0',
            'lastUpdated': datetime.utcnow().isoformat() + 'Z',
            'keywords': {
                'primary': [],
                'secondary': [],
                'longtail': []
            },
            'topicClusters': {},
            'tracking': {
                'articlesPerKeyword': {},
                'keywordPerformance': {},
                'lastSyncedFromSEO': None
            }
        }

    def get_all_keywords(self) -> List[Keyword]:
        """Get all keywords as Keyword objects."""
        data = self._load()
        keywords = []

        for tier in ['primary', 'secondary', 'longtail']:
            for kw in data['keywords'].get(tier, []):
                keywords.append(Keyword(
                    keyword=kw['keyword'],
                    priority=kw.get('priority', 50),
                    volume=kw.get('volume', 'low'),
                    difficulty=kw.get('difficulty', 'medium'),
                    intent=kw.get('intent', 'informational'),
                    status=kw.get('status', 'active'),
                    last_targeted=kw.get('lastTargeted'),
                    performance=kw.get('performance')
                ))

        return keywords

    def get_priority_keywords(self, limit: int = 20) -> List[Keyword]:
        """Get top priority keywords."""
        keywords = self.get_all_keywords()
        active = [k for k in keywords if k.status == 'active']
        return sorted(active, key=lambda k: k.priority, reverse=True)[:limit]

    def get_untargeted_keywords(self, days_threshold: int = 30) -> List[Keyword]:
        """Get keywords not targeted in specified days."""
        from datetime import datetime, timedelta

        cutoff = datetime.utcnow() - timedelta(days=days_threshold)
        keywords = self.get_all_keywords()

        untargeted = []
        for kw in keywords:
            if kw.status != 'active':
                continue
            if kw.last_targeted is None:
                untargeted.append(kw)
            else:
                try:
                    targeted_date = datetime.fromisoformat(kw.last_targeted.replace('Z', '+00:00'))
                    if targeted_date.replace(tzinfo=None) < cutoff:
                        untargeted.append(kw)
                except (ValueError, AttributeError):
                    untargeted.append(kw)

        return untargeted

    def get_topic_clusters(self) -> Dict[str, TopicCluster]:
        """Get topic clusters."""
        data = self._load()
        clusters = {}

        for cluster_id, cluster_data in data.get('topicClusters', {}).items():
            clusters[cluster_id] = TopicCluster(
                pillar=cluster_data.get('pillar', ''),
                clusters=cluster_data.get('clusters', [])
            )

        return clusters

    def update_keyword_performance(
        self,
        keyword: str,
        avg_position: Optional[float] = None,
        clicks: Optional[int] = None,
        impressions: Optional[int] = None,
        ctr: Optional[float] = None
    ) -> bool:
        """
        Update performance metrics for a keyword.

        Args:
            keyword: The keyword to update
            avg_position: Average search position
            clicks: Total clicks
            impressions: Total impressions
            ctr: Click-through rate percentage

        Returns:
            True if keyword was found and updated
        """
        data = self._load()

        # Find keyword in any tier
        for tier in ['primary', 'secondary', 'longtail']:
            for kw in data['keywords'].get(tier, []):
                if kw['keyword'].lower() == keyword.lower():
                    # Update performance
                    if 'performance' not in kw or kw['performance'] is None:
                        kw['performance'] = {}

                    if avg_position is not None:
                        kw['performance']['avgPosition'] = avg_position
                    if clicks is not None:
                        kw['performance']['clicks'] = clicks
                    if impressions is not None:
                        kw['performance']['impressions'] = impressions
                    if ctr is not None:
                        kw['performance']['ctr'] = ctr

                    kw['performance']['lastUpdated'] = datetime.utcnow().isoformat() + 'Z'

                    # Also update tracking
                    data['tracking']['keywordPerformance'][keyword] = kw['performance']

                    # Adjust priority based on performance
                    self._adjust_priority_from_performance(kw)

                    self._save()
                    return True

        return False

    def _adjust_priority_from_performance(self, kw: Dict) -> None:
        """Adjust keyword priority based on performance."""
        perf = kw.get('performance', {})
        if not perf:
            return

        avg_pos = perf.get('avgPosition')
        ctr = perf.get('ctr')

        # Boost for well-performing keywords
        if avg_pos and avg_pos < 10 and ctr and ctr > 5:
            kw['priority'] = min(100, kw.get('priority', 50) + 5)
        # Reduce for poor performers
        elif avg_pos and avg_pos > 50:
            articles_count = perf.get('articlesCount', 0)
            if articles_count > 2:
                kw['priority'] = max(20, kw.get('priority', 50) - 5)

    def sync_keywords(self, seo_keywords: List[Dict]) -> int:
        """
        Sync keywords from SEO agent analysis.

        Args:
            seo_keywords: List of dicts with keyword, priority, etc.

        Returns:
            Number of keywords updated/added
        """
        data = self._load()
        updated = 0

        for seo_kw in seo_keywords:
            keyword = seo_kw.get('keyword', '')
            if not keyword:
                continue

            # Check if exists
            found = False
            for tier in ['primary', 'secondary', 'longtail']:
                for kw in data['keywords'].get(tier, []):
                    if kw['keyword'].lower() == keyword.lower():
                        # Update priority if higher
                        if seo_kw.get('priority', 0) > kw.get('priority', 0):
                            kw['priority'] = seo_kw['priority']
                        found = True
                        updated += 1
                        break
                if found:
                    break

            # Add new keyword to longtail
            if not found:
                data['keywords']['longtail'].append({
                    'keyword': keyword,
                    'priority': seo_kw.get('priority', 50),
                    'volume': seo_kw.get('volume', 'low'),
                    'difficulty': seo_kw.get('difficulty', 'low'),
                    'intent': seo_kw.get('intent', 'informational'),
                    'status': 'active',
                    'lastTargeted': None,
                    'performance': None
                })
                updated += 1

            # Update performance if provided
            if any(k in seo_kw for k in ['avgPosition', 'clicks', 'impressions']):
                self.update_keyword_performance(
                    keyword,
                    avg_position=seo_kw.get('avgPosition'),
                    clicks=seo_kw.get('clicks'),
                    impressions=seo_kw.get('impressions'),
                    ctr=seo_kw.get('ctr')
                )

        data['tracking']['lastSyncedFromSEO'] = datetime.utcnow().isoformat() + 'Z'
        self._save()

        self.logger.info(f"Synced {updated} keywords from SEO agent")
        return updated

    def mark_keyword_targeted(self, keyword: str, article_slug: str) -> bool:
        """
        Mark a keyword as targeted with an article.

        Args:
            keyword: The keyword that was targeted
            article_slug: Slug of the article targeting this keyword

        Returns:
            True if keyword was found and updated
        """
        data = self._load()
        now = datetime.utcnow().isoformat() + 'Z'

        # Find and update keyword
        for tier in ['primary', 'secondary', 'longtail']:
            for kw in data['keywords'].get(tier, []):
                if kw['keyword'].lower() == keyword.lower():
                    kw['lastTargeted'] = now
                    break

        # Track article for keyword
        if keyword not in data['tracking']['articlesPerKeyword']:
            data['tracking']['articlesPerKeyword'][keyword] = []

        if article_slug not in data['tracking']['articlesPerKeyword'][keyword]:
            data['tracking']['articlesPerKeyword'][keyword].append(article_slug)

        self._save()
        return True

    def get_keyword_stats(self) -> Dict[str, Any]:
        """Get summary statistics about keywords."""
        keywords = self.get_all_keywords()
        active = [k for k in keywords if k.status == 'active']

        from datetime import datetime, timedelta
        cutoff = datetime.utcnow() - timedelta(days=30)

        recently_targeted = []
        for kw in keywords:
            if kw.last_targeted:
                try:
                    targeted_date = datetime.fromisoformat(kw.last_targeted.replace('Z', '+00:00'))
                    if targeted_date.replace(tzinfo=None) > cutoff:
                        recently_targeted.append(kw)
                except (ValueError, AttributeError):
                    pass

        # Top performers
        top_performers = sorted(
            [k for k in keywords if k.priority >= 80 and k.last_targeted],
            key=lambda k: k.priority,
            reverse=True
        )[:5]

        # Needs attention
        needs_attention = sorted(
            [k for k in keywords if k.priority >= 70 and not k.last_targeted],
            key=lambda k: k.priority,
            reverse=True
        )[:5]

        return {
            'total_keywords': len(keywords),
            'active_keywords': len(active),
            'targeted_last_30_days': len(recently_targeted),
            'top_performers': [k.keyword for k in top_performers],
            'needs_attention': [k.keyword for k in needs_attention]
        }


# Convenience function for quick access
def get_shared_keywords_manager(logger: Optional[logging.Logger] = None) -> SharedKeywordsManager:
    """Get a SharedKeywordsManager instance."""
    return SharedKeywordsManager(logger=logger)
