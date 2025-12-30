"""
Internal Linking Architect Agent

Analyzes and improves internal link structure.
"""

import time
import logging
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urlparse
from collections import defaultdict

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


class InternalLinkingArchitect(BaseAgent):
    """
    Manages internal linking structure.

    Responsibilities:
    - Map site structure and link graph
    - Calculate crawl depth
    - Identify orphan pages
    - Suggest contextual internal links
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.link_graph: Dict[str, Set[str]] = defaultdict(set)
        self.incoming_links: Dict[str, Set[str]] = defaultdict(set)
        self.orphan_pages: List[str] = []
        self.avg_depth = 0.0

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """Analyze internal linking structure."""
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info(f"Analyzing link graph for {len(crawl_data)} pages")

        try:
            # Build link graph
            self._build_link_graph(crawl_data)

            # Find orphan pages
            orphan_tasks = self._find_orphan_pages(crawl_data)
            tasks.extend(orphan_tasks)

            # Calculate crawl depth
            depths = self._calculate_depths(crawl_data)

            # Find pages with low internal links
            low_link_tasks = self._find_low_link_pages(crawl_data)
            tasks.extend(low_link_tasks)

            # Suggest contextual links
            suggestion_tasks = self._suggest_contextual_links(crawl_data)
            tasks.extend(suggestion_tasks)

            result.tasks = tasks
            result.metrics = {
                'total_pages': len(crawl_data),
                'orphan_pages': len(self.orphan_pages),
                'avg_crawl_depth': self.avg_depth,
                'max_crawl_depth': max(depths.values()) if depths else 0,
                'avg_internal_links': sum(len(links) for links in self.link_graph.values()) / len(crawl_data) if crawl_data else 0
            }

            result.summary = (
                f"Analyzed {len(crawl_data)} pages. "
                f"Found {len(self.orphan_pages)} orphan pages. "
                f"Avg depth: {self.avg_depth:.1f}."
            )

        except Exception as e:
            result.success = False
            result.errors.append(str(e))

        result.execution_time = time.time() - start_time
        return result

    def _build_link_graph(self, crawl_data: Dict) -> None:
        """Build internal link graph."""
        for url, page in crawl_data.items():
            if hasattr(page, 'internal_links'):
                for link in page.internal_links:
                    normalized = self._normalize_url(link)
                    self.link_graph[url].add(normalized)
                    self.incoming_links[normalized].add(url)

    def _normalize_url(self, url: str) -> str:
        """Normalize URL for comparison."""
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip('/')

    def _find_orphan_pages(self, crawl_data: Dict) -> List[Task]:
        """Find pages with no incoming internal links."""
        tasks = []

        for url in crawl_data:
            normalized = self._normalize_url(url)
            parsed = urlparse(url)

            # Skip homepage
            if parsed.path in ('', '/'):
                continue

            if normalized not in self.incoming_links or len(self.incoming_links[normalized]) == 0:
                self.orphan_pages.append(url)
                tasks.append(self.create_task(
                    description=f"Orphan page needs internal links: {url}",
                    priority=TaskPriority.MEDIUM.value,
                    risk=TaskRisk.LOW.value,
                    action_type="report",
                    target_url=url,
                    metadata={'issue': 'orphan_page'}
                ))

        return tasks

    def _calculate_depths(self, crawl_data: Dict) -> Dict[str, int]:
        """Calculate crawl depth from homepage."""
        depths = {}
        homepage = None

        # Find homepage
        for url in crawl_data:
            parsed = urlparse(url)
            if parsed.path in ('', '/'):
                homepage = url
                break

        if not homepage:
            return depths

        # BFS from homepage
        from collections import deque
        queue = deque([(homepage, 0)])
        visited = {homepage}
        depths[homepage] = 0

        while queue:
            current, depth = queue.popleft()
            for link in self.link_graph.get(current, []):
                if link not in visited and link in crawl_data:
                    visited.add(link)
                    depths[link] = depth + 1
                    queue.append((link, depth + 1))

        if depths:
            self.avg_depth = sum(depths.values()) / len(depths)

        return depths

    def _find_low_link_pages(self, crawl_data: Dict) -> List[Task]:
        """Find pages with too few internal links."""
        tasks = []
        min_links = self.get_config('thresholds.seo.min_internal_links', 3)

        for url, page in crawl_data.items():
            link_count = len(getattr(page, 'internal_links', []))
            if link_count < min_links:
                tasks.append(self.create_task(
                    description=f"Page has only {link_count} internal links (min: {min_links}): {url}",
                    priority=TaskPriority.LOW.value,
                    risk=TaskRisk.MINIMAL.value,
                    action_type="report",
                    target_url=url,
                    metadata={'internal_links': link_count}
                ))

        return tasks

    def _suggest_contextual_links(self, crawl_data: Dict) -> List[Task]:
        """Suggest contextual internal links based on content."""
        tasks = []
        # Get cluster configuration
        clusters = self.get_config('clusters', {})

        # Map pages to clusters based on URL patterns
        for cluster_name, cluster_config in clusters.items():
            cluster_products = cluster_config.get('products', [])
            cluster_keywords = cluster_config.get('keywords', [])

            # Find pages in this cluster that could link to each other
            cluster_pages = []
            for url in crawl_data:
                for product in cluster_products:
                    if product in url.lower():
                        cluster_pages.append(url)
                        break

            # Suggest cross-links within cluster (limit to avoid spam)
            if len(cluster_pages) >= 2:
                for i, page in enumerate(cluster_pages[:3]):
                    for other_page in cluster_pages[:3]:
                        if page != other_page:
                            # Check if link already exists
                            if other_page not in self.link_graph.get(page, set()):
                                tasks.append(self.create_task(
                                    description=f"Consider linking from {page} to {other_page} ({cluster_name} cluster)",
                                    priority=TaskPriority.LOW.value,
                                    risk=TaskRisk.MINIMAL.value,
                                    action_type="report",
                                    target_url=page,
                                    metadata={
                                        'suggested_link': other_page,
                                        'cluster': cluster_name
                                    }
                                ))

        return tasks[:10]  # Limit suggestions

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'orphan_pages': len(self.orphan_pages),
            'avg_crawl_depth': self.avg_depth,
            'total_internal_links': sum(len(links) for links in self.link_graph.values())
        }
