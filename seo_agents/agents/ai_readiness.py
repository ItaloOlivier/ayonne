"""
AI Readiness Agent

Optimizes content for AI/LLM extractability and discovery.
"""

import time
import json
import logging
from typing import Dict, List, Optional

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


class AIReadinessAgent(BaseAgent):
    """
    Optimizes for AI search and LLM extractability.

    Responsibilities:
    - Optimize for LLM extractability
    - Ensure answer-first content structure
    - Add entity clarity markers
    - Format for AI shopping integration
    - Maintain llms.txt
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.pages_analyzed = 0
        self.ai_ready_pages = 0

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """Analyze AI readiness of content."""
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info(f"Analyzing AI readiness for {len(crawl_data)} pages")

        try:
            # Check llms.txt
            llms_tasks = self._check_llms_txt()
            tasks.extend(llms_tasks)

            # Check each page for AI-friendly structure
            for url, page in crawl_data.items():
                if hasattr(page, 'status_code') and page.status_code != 200:
                    continue
                self.pages_analyzed += 1
                page_tasks = self._analyze_page_ai_readiness(url, page)
                tasks.extend(page_tasks)

            result.tasks = tasks
            result.metrics = {
                'pages_analyzed': self.pages_analyzed,
                'ai_ready_pages': self.ai_ready_pages,
                'ai_readiness_score': self.ai_ready_pages / self.pages_analyzed if self.pages_analyzed > 0 else 0
            }

            result.summary = (
                f"Analyzed {self.pages_analyzed} pages. "
                f"{self.ai_ready_pages} are AI-ready ({result.metrics['ai_readiness_score']:.0%})."
            )

        except Exception as e:
            result.success = False
            result.errors.append(str(e))

        result.execution_time = time.time() - start_time
        return result

    def _check_llms_txt(self) -> List[Task]:
        """Check llms.txt exists and is comprehensive."""
        tasks = []

        # Check if llms.txt exists in public folder
        import os
        llms_path = os.path.join(os.getcwd(), 'public', 'llms.txt')

        if not os.path.exists(llms_path):
            tasks.append(self.create_task(
                description="Create llms.txt file for AI discovery",
                priority=TaskPriority.HIGH.value,
                risk=TaskRisk.LOW.value,
                action_type="create",
                target_file="public/llms.txt",
                metadata={'file_type': 'llms_txt'}
            ))
        else:
            # Check if it has key sections
            try:
                with open(llms_path, 'r') as f:
                    content = f.read().lower()

                required_sections = ['about', 'products', 'features', 'contact']
                for section in required_sections:
                    if section not in content:
                        tasks.append(self.create_task(
                            description=f"llms.txt missing '{section}' section",
                            priority=TaskPriority.MEDIUM.value,
                            risk=TaskRisk.LOW.value,
                            action_type="modify",
                            target_file="public/llms.txt",
                            changes={'add_section': section}
                        ))
            except Exception as e:
                self.log_warning(f"Could not read llms.txt: {e}")

        return tasks

    def _analyze_page_ai_readiness(self, url: str, page) -> List[Task]:
        """Analyze a page for AI-friendly structure."""
        tasks = []
        html = getattr(page, 'html', '') or ''
        is_ai_ready = True

        # Check for answer-first structure (first paragraph should be informative)
        # This is a simplified check
        if not self._has_answer_first(html):
            is_ai_ready = False
            tasks.append(self.create_task(
                description=f"Consider answer-first content structure: {url}",
                priority=TaskPriority.LOW.value,
                risk=TaskRisk.MINIMAL.value,
                action_type="report",
                target_url=url,
                metadata={'optimization': 'answer_first'}
            ))

        # Check for FAQ blocks
        if not self._has_faq_block(html) and self._should_have_faq(url):
            tasks.append(self.create_task(
                description=f"Add FAQ block for AI extraction: {url}",
                priority=TaskPriority.MEDIUM.value,
                risk=TaskRisk.LOW.value,
                action_type="modify",
                target_url=url,
                metadata={'add': 'faq_block'}
            ))

        # Check for clear entity definitions
        if '/products/' in url.lower():
            if not self._has_clear_product_info(html):
                is_ai_ready = False
                tasks.append(self.create_task(
                    description=f"Improve product info clarity for AI: {url}",
                    priority=TaskPriority.MEDIUM.value,
                    risk=TaskRisk.LOW.value,
                    action_type="report",
                    target_url=url,
                    metadata={'optimization': 'entity_clarity'}
                ))

        if is_ai_ready:
            self.ai_ready_pages += 1

        return tasks

    def _has_answer_first(self, html: str) -> bool:
        """Check if content has answer-first structure."""
        # Simple heuristic: first paragraph should be substantial
        from bs4 import BeautifulSoup
        try:
            soup = BeautifulSoup(html, 'lxml')
            first_p = soup.find('p')
            if first_p:
                text = first_p.get_text(strip=True)
                return len(text) > 100  # At least 100 chars
        except Exception:
            pass
        return False

    def _has_faq_block(self, html: str) -> bool:
        """Check if page has FAQ block."""
        return 'faq' in html.lower() or 'frequently asked' in html.lower()

    def _should_have_faq(self, url: str) -> bool:
        """Determine if URL should have FAQ."""
        faq_worthy = ['product', 'skin-analysis', 'about', 'how-to']
        return any(term in url.lower() for term in faq_worthy)

    def _has_clear_product_info(self, html: str) -> bool:
        """Check if product page has clear info structure."""
        required_terms = ['ingredients', 'benefits', 'how to use']
        html_lower = html.lower()
        return sum(1 for term in required_terms if term in html_lower) >= 2

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'pages_analyzed': self.pages_analyzed,
            'ai_readiness_score': self.ai_ready_pages / self.pages_analyzed if self.pages_analyzed > 0 else 0
        }
