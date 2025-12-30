"""
Content Refresh Agent

Identifies and improves outdated content.
"""

import time
import logging
from typing import Dict, List, Optional

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


class ContentRefreshAgent(BaseAgent):
    """
    Refreshes and improves existing content.

    Responsibilities:
    - Identify outdated content
    - Suggest content improvements for E-E-A-T
    - Ensure accurate, non-medical claims
    - Add missing sections (FAQs, comparisons)
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.pages_analyzed = 0
        self.refresh_candidates = 0

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """Analyze content for refresh opportunities."""
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info(f"Analyzing content freshness for {len(crawl_data)} pages")

        try:
            for url, page in crawl_data.items():
                if hasattr(page, 'status_code') and page.status_code != 200:
                    continue

                self.pages_analyzed += 1
                page_tasks = self._analyze_page_content(url, page)
                tasks.extend(page_tasks)

            result.tasks = tasks
            result.metrics = {
                'pages_analyzed': self.pages_analyzed,
                'refresh_candidates': self.refresh_candidates,
                'tasks_generated': len(tasks)
            }

            result.summary = (
                f"Analyzed {self.pages_analyzed} pages. "
                f"Found {self.refresh_candidates} refresh candidates."
            )

        except Exception as e:
            result.success = False
            result.errors.append(str(e))

        result.execution_time = time.time() - start_time
        return result

    def _analyze_page_content(self, url: str, page) -> List[Task]:
        """Analyze a single page for content improvements."""
        tasks = []
        word_count = getattr(page, 'word_count', 0)
        min_words = self.get_config('thresholds.content.min_word_count', 300)

        # Thin content check
        if word_count < min_words:
            self.refresh_candidates += 1
            tasks.append(self.create_task(
                description=f"Thin content ({word_count} words) needs expansion: {url}",
                priority=TaskPriority.MEDIUM.value,
                risk=TaskRisk.MEDIUM.value,
                action_type="modify",
                target_url=url,
                metadata={'word_count': word_count, 'min_required': min_words}
            ))

        # Check for FAQ section
        if not self._has_faq_section(page):
            tasks.append(self.create_task(
                description=f"Consider adding FAQ section: {url}",
                priority=TaskPriority.LOW.value,
                risk=TaskRisk.MINIMAL.value,
                action_type="report",
                target_url=url,
                metadata={'suggestion': 'add_faq'}
            ))

        # Check for disclaimer (for skincare content)
        if 'skin' in url.lower() or 'product' in url.lower():
            if not self._has_disclaimer(page):
                tasks.append(self.create_task(
                    description=f"Add skincare disclaimer to: {url}",
                    priority=TaskPriority.MEDIUM.value,
                    risk=TaskRisk.LOW.value,
                    action_type="modify",
                    target_url=url,
                    changes={'add': 'disclaimer'},
                    metadata={'required': 'skincare_disclaimer'}
                ))

        return tasks

    def _has_faq_section(self, page) -> bool:
        """Check if page has FAQ section."""
        html = getattr(page, 'html', '') or ''
        return 'faq' in html.lower() or 'frequently asked' in html.lower()

    def _has_disclaimer(self, page) -> bool:
        """Check if page has required disclaimer."""
        html = getattr(page, 'html', '') or ''
        disclaimer_phrases = [
            'not medical advice',
            'consult a dermatologist',
            'individual results may vary',
            'for informational purposes'
        ]
        return any(phrase in html.lower() for phrase in disclaimer_phrases)

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'pages_analyzed': self.pages_analyzed,
            'refresh_candidates': self.refresh_candidates
        }
