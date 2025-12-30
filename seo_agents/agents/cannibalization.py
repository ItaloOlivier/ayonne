"""
Cannibalization & Pruning Agent

Detects keyword cannibalization and identifies pages to prune.
"""

import time
import logging
from typing import Dict, List, Optional, Set
from collections import defaultdict

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


class CannibalizationAgent(BaseAgent):
    """
    Detects cannibalization and recommends pruning.

    Responsibilities:
    - Detect keyword cannibalization
    - Identify thin/duplicate content
    - Suggest merge/redirect/retire actions
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.cannibalization_issues = 0
        self.thin_pages = 0
        self.duplicate_candidates = 0

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """Analyze for cannibalization and pruning opportunities."""
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info(f"Analyzing {len(crawl_data)} pages for cannibalization")

        try:
            # Find title/H1 similarities (cannibalization signal)
            cannib_tasks = self._find_similar_titles(crawl_data)
            tasks.extend(cannib_tasks)

            # Find thin content
            thin_tasks = self._find_thin_content(crawl_data)
            tasks.extend(thin_tasks)

            # Find potential duplicates
            dup_tasks = self._find_duplicate_candidates(crawl_data)
            tasks.extend(dup_tasks)

            result.tasks = tasks
            result.metrics = {
                'cannibalization_issues': self.cannibalization_issues,
                'thin_pages': self.thin_pages,
                'duplicate_candidates': self.duplicate_candidates
            }

            result.summary = (
                f"Found {self.cannibalization_issues} cannibalization issues, "
                f"{self.thin_pages} thin pages, {self.duplicate_candidates} potential duplicates."
            )

        except Exception as e:
            result.success = False
            result.errors.append(str(e))

        result.execution_time = time.time() - start_time
        return result

    def _find_similar_titles(self, crawl_data: Dict) -> List[Task]:
        """Find pages with very similar titles."""
        tasks = []
        titles: Dict[str, List[str]] = defaultdict(list)

        for url, page in crawl_data.items():
            title = getattr(page, 'title', '') or ''
            if title:
                # Normalize title for comparison
                normalized = self._normalize_text(title)
                titles[normalized].append(url)

        # Report groups with similar titles
        for normalized_title, urls in titles.items():
            if len(urls) > 1:
                self.cannibalization_issues += 1
                tasks.append(self.create_task(
                    description=f"Similar titles ({len(urls)} pages): '{normalized_title[:50]}'",
                    priority=TaskPriority.MEDIUM.value,
                    risk=TaskRisk.MEDIUM.value,
                    action_type="report",
                    metadata={
                        'issue': 'title_cannibalization',
                        'urls': urls,
                        'title': normalized_title
                    }
                ))

        return tasks

    def _find_thin_content(self, crawl_data: Dict) -> List[Task]:
        """Find pages with thin content."""
        tasks = []
        min_words = self.get_config('thresholds.content.min_word_count', 300)

        for url, page in crawl_data.items():
            word_count = getattr(page, 'word_count', 0)

            # Skip pages that are intentionally short
            if '/api/' in url or '/cart' in url or '/checkout' in url:
                continue

            if word_count < min_words // 2:  # Very thin
                self.thin_pages += 1
                tasks.append(self.create_task(
                    description=f"Very thin content ({word_count} words): {url}",
                    priority=TaskPriority.MEDIUM.value,
                    risk=TaskRisk.MEDIUM.value,
                    action_type="report",
                    target_url=url,
                    metadata={
                        'word_count': word_count,
                        'recommendation': 'expand_or_consolidate'
                    }
                ))

        return tasks

    def _find_duplicate_candidates(self, crawl_data: Dict) -> List[Task]:
        """Find potential duplicate content."""
        tasks = []

        # Group by similar URL patterns
        url_patterns: Dict[str, List[str]] = defaultdict(list)
        for url in crawl_data:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            # Create pattern by removing numbers and IDs
            import re
            pattern = re.sub(r'\d+', 'N', parsed.path)
            url_patterns[pattern].append(url)

        # Check patterns with multiple URLs
        for pattern, urls in url_patterns.items():
            if len(urls) > 5:  # Many similar URLs might indicate duplication
                self.duplicate_candidates += 1
                tasks.append(self.create_task(
                    description=f"Review {len(urls)} similar URLs matching pattern: {pattern}",
                    priority=TaskPriority.LOW.value,
                    risk=TaskRisk.LOW.value,
                    action_type="report",
                    metadata={
                        'pattern': pattern,
                        'sample_urls': urls[:5]
                    }
                ))

        return tasks

    def _normalize_text(self, text: str) -> str:
        """Normalize text for comparison."""
        import re
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'cannibalization_issues': self.cannibalization_issues,
            'thin_pages': self.thin_pages,
            'duplicate_candidates': self.duplicate_candidates
        }
