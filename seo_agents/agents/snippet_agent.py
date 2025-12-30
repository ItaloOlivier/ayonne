"""
Snippet & PAA Agent

Optimizes content for featured snippets and People Also Ask.
"""

import time
import logging
from typing import Dict, List, Optional

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


class SnippetPAAAgent(BaseAgent):
    """
    Optimizes for featured snippets and PAA.

    Responsibilities:
    - Identify snippet opportunities
    - Format content for featured snippets
    - Create PAA-targeted Q&A blocks
    - Add HowTo schema where appropriate
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.snippet_opportunities = 0
        self.paa_blocks_found = 0

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """Analyze snippet and PAA opportunities."""
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info(f"Analyzing snippet opportunities for {len(crawl_data)} pages")

        try:
            for url, page in crawl_data.items():
                if hasattr(page, 'status_code') and page.status_code != 200:
                    continue
                page_tasks = self._analyze_page_snippets(url, page)
                tasks.extend(page_tasks)

            result.tasks = tasks
            result.metrics = {
                'snippet_opportunities': self.snippet_opportunities,
                'paa_blocks_found': self.paa_blocks_found
            }

            result.summary = (
                f"Found {self.snippet_opportunities} snippet opportunities. "
                f"Identified {self.paa_blocks_found} PAA-formatted blocks."
            )

        except Exception as e:
            result.success = False
            result.errors.append(str(e))

        result.execution_time = time.time() - start_time
        return result

    def _analyze_page_snippets(self, url: str, page) -> List[Task]:
        """Analyze page for snippet optimization."""
        tasks = []
        html = getattr(page, 'html', '') or ''
        title = getattr(page, 'title', '') or ''

        # Check for "how to" content needing HowTo schema
        if 'how to' in title.lower() or 'how to' in url.lower():
            schema_data = getattr(page, 'schema_data', [])
            has_howto = any(
                s.get('@type') == 'HowTo'
                for s in schema_data
                if isinstance(s, dict)
            )

            if not has_howto:
                self.snippet_opportunities += 1
                tasks.append(self.create_task(
                    description=f"Add HowTo schema for snippet eligibility: {url}",
                    priority=TaskPriority.MEDIUM.value,
                    risk=TaskRisk.LOW.value,
                    action_type="modify",
                    target_url=url,
                    metadata={'optimization': 'howto_schema'}
                ))

        # Check for list-formatted content
        if self._has_list_opportunity(html):
            if not self._has_proper_list_markup(html):
                self.snippet_opportunities += 1
                tasks.append(self.create_task(
                    description=f"Format lists with proper HTML for snippets: {url}",
                    priority=TaskPriority.LOW.value,
                    risk=TaskRisk.MINIMAL.value,
                    action_type="report",
                    target_url=url,
                    metadata={'optimization': 'list_formatting'}
                ))

        # Check for definition/answer opportunities
        if self._is_definition_page(title, url):
            if not self._has_definition_format(html):
                self.snippet_opportunities += 1
                tasks.append(self.create_task(
                    description=f"Add definition-style answer block: {url}",
                    priority=TaskPriority.MEDIUM.value,
                    risk=TaskRisk.LOW.value,
                    action_type="report",
                    target_url=url,
                    metadata={'optimization': 'definition_block'}
                ))

        # Count PAA-formatted content
        if self._has_paa_format(html):
            self.paa_blocks_found += 1

        return tasks

    def _has_list_opportunity(self, html: str) -> bool:
        """Check if content has list-like patterns."""
        list_indicators = ['step 1', 'step 2', '1.', '2.', 'first,', 'second,', 'benefit', 'advantage']
        html_lower = html.lower()
        return sum(1 for ind in list_indicators if ind in html_lower) >= 2

    def _has_proper_list_markup(self, html: str) -> bool:
        """Check if lists use proper HTML markup."""
        return '<ol>' in html.lower() or '<ul>' in html.lower()

    def _is_definition_page(self, title: str, url: str) -> bool:
        """Check if page is likely a definition/guide page."""
        definition_terms = ['what is', 'what are', 'guide', 'explained', 'benefits of']
        combined = f"{title} {url}".lower()
        return any(term in combined for term in definition_terms)

    def _has_definition_format(self, html: str) -> bool:
        """Check if page has definition-style formatting."""
        # Look for patterns like bold term followed by definition
        from bs4 import BeautifulSoup
        try:
            soup = BeautifulSoup(html, 'lxml')
            # Check for <dt>/<dd> or <strong> followed by description
            has_dl = soup.find('dl') is not None
            has_strong_definitions = len(soup.find_all('strong')) > 2
            return has_dl or has_strong_definitions
        except Exception:
            return False

    def _has_paa_format(self, html: str) -> bool:
        """Check if page has PAA-friendly Q&A format."""
        qa_indicators = ['<h2', '<h3', '?</h', 'faq', 'question', 'answer']
        html_lower = html.lower()
        return sum(1 for ind in qa_indicators if ind in html_lower) >= 3

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'snippet_opportunities': self.snippet_opportunities,
            'paa_blocks_found': self.paa_blocks_found
        }
