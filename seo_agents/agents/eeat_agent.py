"""
E-E-A-T Agent

Audits Experience, Expertise, Authoritativeness, and Trustworthiness signals.
"""

import time
import logging
from typing import Dict, List, Optional

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


class EEATAgent(BaseAgent):
    """
    Audits E-E-A-T signals.

    Responsibilities:
    - Audit trust signals
    - Check author attribution
    - Verify source citations
    - Ensure policy pages exist
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.trust_signals_found = 0
        self.trust_signals_missing = 0

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """Analyze E-E-A-T signals across the site."""
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info("Analyzing E-E-A-T signals")

        try:
            # Check for required policy pages
            policy_tasks = self._check_policy_pages(crawl_data)
            tasks.extend(policy_tasks)

            # Check for trust signals on content pages
            for url, page in crawl_data.items():
                if hasattr(page, 'status_code') and page.status_code != 200:
                    continue
                page_tasks = self._check_page_trust_signals(url, page)
                tasks.extend(page_tasks)

            # Check for author/expert attribution
            author_tasks = self._check_author_attribution(crawl_data)
            tasks.extend(author_tasks)

            result.tasks = tasks
            result.metrics = {
                'trust_signals_found': self.trust_signals_found,
                'trust_signals_missing': self.trust_signals_missing,
                'eeat_score': self.trust_signals_found / (self.trust_signals_found + self.trust_signals_missing) if (self.trust_signals_found + self.trust_signals_missing) > 0 else 0
            }

            result.summary = (
                f"Found {self.trust_signals_found} trust signals. "
                f"Missing {self.trust_signals_missing} recommended signals."
            )

        except Exception as e:
            result.success = False
            result.errors.append(str(e))

        result.execution_time = time.time() - start_time
        return result

    def _check_policy_pages(self, crawl_data: Dict) -> List[Task]:
        """Check for required policy pages."""
        tasks = []
        required_policies = [
            ('/policies/privacy-policy', 'Privacy Policy'),
            ('/policies/terms-of-service', 'Terms of Service'),
            ('/policies/refund-policy', 'Refund Policy'),
            ('/pages/about', 'About Us'),
            ('/pages/contact', 'Contact'),
        ]

        urls_lower = [url.lower() for url in crawl_data.keys()]

        for path, name in required_policies:
            found = any(path in url for url in urls_lower)
            if found:
                self.trust_signals_found += 1
            else:
                self.trust_signals_missing += 1
                tasks.append(self.create_task(
                    description=f"Missing or unindexed policy page: {name}",
                    priority=TaskPriority.HIGH.value,
                    risk=TaskRisk.LOW.value,
                    action_type="report",
                    metadata={'missing_page': path, 'page_type': name}
                ))

        return tasks

    def _check_page_trust_signals(self, url: str, page) -> List[Task]:
        """Check individual page for trust signals."""
        tasks = []
        html = getattr(page, 'html', '') or ''

        # Check for reviews/testimonials
        if 'product' in url.lower():
            if 'review' not in html.lower() and 'testimonial' not in html.lower():
                tasks.append(self.create_task(
                    description=f"Product page missing reviews: {url}",
                    priority=TaskPriority.LOW.value,
                    risk=TaskRisk.MINIMAL.value,
                    action_type="report",
                    target_url=url,
                    metadata={'missing': 'reviews'}
                ))

        return tasks

    def _check_author_attribution(self, crawl_data: Dict) -> List[Task]:
        """Check for author attribution on content pages."""
        tasks = []

        for url in crawl_data:
            if '/blog/' in url or '/articles/' in url:
                page = crawl_data[url]
                html = getattr(page, 'html', '') or ''

                if 'author' not in html.lower() and 'written by' not in html.lower():
                    self.trust_signals_missing += 1
                    tasks.append(self.create_task(
                        description=f"Content page missing author attribution: {url}",
                        priority=TaskPriority.MEDIUM.value,
                        risk=TaskRisk.LOW.value,
                        action_type="modify",
                        target_url=url,
                        metadata={'missing': 'author_attribution'}
                    ))
                else:
                    self.trust_signals_found += 1

        return tasks

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'trust_signals_found': self.trust_signals_found,
            'trust_signals_missing': self.trust_signals_missing
        }
