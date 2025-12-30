"""
Conversion Rate Agent

Audits CTA placement, trust signals, and conversion elements.
"""

import time
import logging
from typing import Dict, List, Optional

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


class ConversionRateAgent(BaseAgent):
    """
    Audits conversion optimization elements.

    Responsibilities:
    - Audit CTA placement
    - Check trust blocks
    - Analyze funnel pages
    - Optimize form accessibility
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.pages_with_cta = 0
        self.pages_missing_cta = 0
        self.trust_signals_found = 0

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """Analyze conversion rate optimization elements."""
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info(f"Analyzing CRO elements on {len(crawl_data)} pages")

        try:
            for url, page in crawl_data.items():
                if hasattr(page, 'status_code') and page.status_code != 200:
                    continue
                page_tasks = self._analyze_page_cro(url, page)
                tasks.extend(page_tasks)

            result.tasks = tasks
            result.metrics = {
                'pages_with_cta': self.pages_with_cta,
                'pages_missing_cta': self.pages_missing_cta,
                'trust_signals_found': self.trust_signals_found,
                'cta_coverage': self.pages_with_cta / (self.pages_with_cta + self.pages_missing_cta) if (self.pages_with_cta + self.pages_missing_cta) > 0 else 0
            }

            result.summary = (
                f"Analyzed CRO elements. "
                f"{self.pages_with_cta} pages have CTAs, "
                f"{self.pages_missing_cta} could benefit from CTAs."
            )

        except Exception as e:
            result.success = False
            result.errors.append(str(e))

        result.execution_time = time.time() - start_time
        return result

    def _analyze_page_cro(self, url: str, page) -> List[Task]:
        """Analyze a page for CRO elements."""
        tasks = []
        html = getattr(page, 'html', '') or ''
        html_lower = html.lower()

        # Check for CTAs
        cta_indicators = ['add to cart', 'buy now', 'shop now', 'get started', 'try free', 'analyze my skin', 'start analysis']
        has_cta = any(cta in html_lower for cta in cta_indicators)

        # Skip pages that shouldn't have sales CTAs
        non_cta_pages = ['/policies/', '/terms', '/privacy', '/contact', '/about']
        should_have_cta = not any(skip in url.lower() for skip in non_cta_pages)

        if has_cta:
            self.pages_with_cta += 1
        elif should_have_cta:
            self.pages_missing_cta += 1
            if '/products/' in url or '/skin' in url.lower():
                tasks.append(self.create_task(
                    description=f"Consider adding CTA to: {url}",
                    priority=TaskPriority.MEDIUM.value,
                    risk=TaskRisk.MINIMAL.value,
                    action_type="report",
                    target_url=url,
                    metadata={'missing': 'cta'}
                ))

        # Check for trust signals
        trust_indicators = ['satisfaction', 'guarantee', 'money back', 'free shipping', 'secure checkout', 'ssl', 'certified', 'cruelty-free', 'vegan']
        trust_count = sum(1 for t in trust_indicators if t in html_lower)

        if trust_count > 0:
            self.trust_signals_found += trust_count

        # Product pages should have trust signals
        if '/products/' in url.lower() and trust_count < 2:
            tasks.append(self.create_task(
                description=f"Add more trust signals to product page: {url}",
                priority=TaskPriority.LOW.value,
                risk=TaskRisk.MINIMAL.value,
                action_type="report",
                target_url=url,
                metadata={'current_trust_signals': trust_count}
            ))

        return tasks

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'cta_coverage': self.pages_with_cta / (self.pages_with_cta + self.pages_missing_cta) if (self.pages_with_cta + self.pages_missing_cta) > 0 else 0,
            'trust_signals_found': self.trust_signals_found
        }
