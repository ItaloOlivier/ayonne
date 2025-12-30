"""
Keyword & Intent Mapper Agent

Maps keywords to pages and identifies cannibalization.
"""

import time
import re
import logging
from typing import Dict, List, Optional, Set
from collections import defaultdict

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


class KeywordIntentMapper(BaseAgent):
    """
    Maps keywords to pages and analyzes search intent.

    Responsibilities:
    - Maintain keyword-to-page mapping
    - Identify keyword cannibalization
    - Map search intent
    - Track keyword clusters
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.keyword_map: Dict[str, List[str]] = defaultdict(list)
        self.cannibalization_issues: List[Dict] = []

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """Analyze keyword mapping and identify issues."""
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info(f"Mapping keywords for {len(crawl_data)} pages")

        try:
            # Extract keywords from each page
            for url, page in crawl_data.items():
                if hasattr(page, 'title') and page.title:
                    keywords = self._extract_keywords(page.title, getattr(page, 'h1', ''))
                    for kw in keywords:
                        self.keyword_map[kw].append(url)

            # Find cannibalization
            cannibalization_tasks = self._find_cannibalization()
            tasks.extend(cannibalization_tasks)

            # Map intent coverage
            intent_tasks = self._analyze_intent_coverage(crawl_data)
            tasks.extend(intent_tasks)

            result.tasks = tasks
            result.metrics = {
                'keywords_mapped': len(self.keyword_map),
                'cannibalization_issues': len(self.cannibalization_issues),
                'pages_analyzed': len(crawl_data)
            }

            result.summary = (
                f"Mapped {len(self.keyword_map)} keywords. "
                f"Found {len(self.cannibalization_issues)} cannibalization issues."
            )

        except Exception as e:
            result.success = False
            result.errors.append(str(e))

        result.execution_time = time.time() - start_time
        return result

    def _extract_keywords(self, title: str, h1: str = '') -> List[str]:
        """Extract keywords from title and H1."""
        keywords = []
        text = f"{title} {h1}".lower()

        # Remove common words
        stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', '-', '|'}

        # Extract 2-3 word phrases
        words = re.findall(r'\b\w+\b', text)
        words = [w for w in words if w not in stopwords and len(w) > 2]

        # Single important words
        for word in words:
            if word in ['vitamin', 'serum', 'moisturizer', 'cream', 'skincare', 'anti-aging', 'retinol', 'collagen', 'hyaluronic', 'niacinamide']:
                keywords.append(word)

        # 2-word phrases
        for i in range(len(words) - 1):
            phrase = f"{words[i]} {words[i+1]}"
            keywords.append(phrase)

        return keywords[:10]  # Limit per page

    def _find_cannibalization(self) -> List[Task]:
        """Find keyword cannibalization issues."""
        tasks = []

        for keyword, urls in self.keyword_map.items():
            if len(urls) > 1:
                self.cannibalization_issues.append({
                    'keyword': keyword,
                    'urls': urls
                })

                if len(urls) <= 3:  # Only report manageable issues
                    tasks.append(self.create_task(
                        description=f"Keyword '{keyword}' targets {len(urls)} pages (cannibalization)",
                        priority=TaskPriority.MEDIUM.value,
                        risk=TaskRisk.LOW.value,
                        action_type="report",
                        metadata={
                            'keyword': keyword,
                            'competing_urls': urls
                        }
                    ))

        return tasks[:10]  # Limit tasks

    def _analyze_intent_coverage(self, crawl_data: Dict) -> List[Task]:
        """Analyze coverage of different search intents."""
        tasks = []
        clusters = self.get_config('clusters', {})

        for cluster_name, cluster_config in clusters.items():
            cluster_keywords = cluster_config.get('keywords', [])
            covered_keywords = []
            missing_keywords = []

            for kw in cluster_keywords:
                if kw.lower() in self.keyword_map:
                    covered_keywords.append(kw)
                else:
                    missing_keywords.append(kw)

            if missing_keywords:
                tasks.append(self.create_task(
                    description=f"Cluster '{cluster_name}' missing content for: {', '.join(missing_keywords[:3])}",
                    priority=TaskPriority.LOW.value,
                    risk=TaskRisk.MINIMAL.value,
                    action_type="report",
                    metadata={
                        'cluster': cluster_name,
                        'missing_keywords': missing_keywords,
                        'covered_keywords': covered_keywords
                    }
                ))

        return tasks

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'keywords_mapped': len(self.keyword_map),
            'cannibalization_issues': len(self.cannibalization_issues)
        }
