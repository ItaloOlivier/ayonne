"""
Core Web Vitals Agent

Tests key pages via PageSpeed Insights API and tracks CWV scores.
"""

import time
import logging
from typing import Dict, List, Optional

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk
from ..tools.pagespeed import PageSpeedChecker, PageSpeedResult


class CWVAgent(BaseAgent):
    """
    Monitors and improves Core Web Vitals.

    Responsibilities:
    - Test key pages via PageSpeed Insights API
    - Track LCP, CLS, INP scores
    - Identify performance bottlenecks
    - Suggest specific optimizations
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.checker = PageSpeedChecker(
            api_key=config.get('psi_api_key'),
            cwv_thresholds=config.get('thresholds', {}).get('cwv', {})
        )
        self.pages_tested = 0
        self.pages_passing = 0

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """
        Run CWV analysis on priority pages.

        Args:
            crawl_data: Dictionary of crawled page data

        Returns:
            AgentResult with CWV scores and recommendations
        """
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        # Get priority pages to test
        priority_pages = self._get_priority_pages()
        self.log_info(f"Testing {len(priority_pages)} priority pages for CWV")

        # Limit to available queries
        if not self.checker.can_query():
            result.warnings.append("PageSpeed Insights daily limit reached")
            self.log_warning("PSI query limit reached")
            result.execution_time = time.time() - start_time
            return result

        try:
            # Test each priority page
            psi_results: List[PageSpeedResult] = []
            for url in priority_pages:
                if not self.checker.can_query():
                    break

                psi_result = self.checker.analyze(url, device='mobile')
                psi_results.append(psi_result)
                self.pages_tested += 1

                if psi_result.passed_cwv:
                    self.pages_passing += 1

                # Create tasks for failing pages
                if not psi_result.error:
                    page_tasks = self._create_cwv_tasks(psi_result)
                    tasks.extend(page_tasks)

            # Generate summary
            summary = self.checker.get_summary(psi_results)

            result.tasks = tasks
            result.metrics = {
                'pages_tested': self.pages_tested,
                'pages_passing_cwv': self.pages_passing,
                'pass_rate': self.pages_passing / self.pages_tested if self.pages_tested > 0 else 0,
                'avg_performance_score': summary.get('avg_performance_score', 0),
                'avg_lcp_ms': summary.get('avg_lcp_ms', 0),
                'avg_cls': summary.get('avg_cls', 0),
                'top_opportunities': summary.get('top_opportunities', [])[:5],
                'queries_remaining': self.checker.max_queries_per_day - self.checker.queries_today
            }

            result.summary = (
                f"Tested {self.pages_tested} pages. "
                f"{self.pages_passing} passing CWV ({result.metrics['pass_rate']:.0%}). "
                f"Avg performance: {result.metrics['avg_performance_score']:.0f}/100."
            )

        except Exception as e:
            result.success = False
            result.errors.append(f"CWV analysis failed: {str(e)}")
            self.log_error(f"CWV analysis failed: {e}")

        result.execution_time = time.time() - start_time
        return result

    def _get_priority_pages(self) -> List[str]:
        """Get list of priority pages to test."""
        pages = []
        base_urls = {
            'primary': f"https://{self.get_config('domains.primary')}",
            'app': f"https://{self.get_config('domains.app')}"
        }

        for domain_key, base_url in base_urls.items():
            if not base_url or base_url == 'https://None':
                continue

            priority_paths = self.get_config(f'priority_pages.{domain_key}', [])
            for path in priority_paths:
                pages.append(f"{base_url}{path}")

        return pages

    def _create_cwv_tasks(self, psi_result: PageSpeedResult) -> List[Task]:
        """Create tasks based on PSI results."""
        tasks = []
        metrics = psi_result.metrics
        thresholds = self.checker.thresholds

        # LCP issues
        if metrics.lcp and metrics.lcp > thresholds['lcp_good']:
            severity = TaskPriority.HIGH if metrics.lcp > thresholds['lcp_needs_improvement'] else TaskPriority.MEDIUM
            tasks.append(self.create_task(
                description=f"LCP too slow ({metrics.lcp:.0f}ms) on {psi_result.url}",
                priority=severity.value,
                risk=TaskRisk.LOW.value,
                action_type="report",
                target_url=psi_result.url,
                metadata={
                    'metric': 'LCP',
                    'value': metrics.lcp,
                    'threshold': thresholds['lcp_good'],
                    'device': psi_result.device
                }
            ))

        # CLS issues
        if metrics.cls and metrics.cls > thresholds['cls_good']:
            severity = TaskPriority.HIGH if metrics.cls > thresholds['cls_needs_improvement'] else TaskPriority.MEDIUM
            tasks.append(self.create_task(
                description=f"CLS too high ({metrics.cls:.3f}) on {psi_result.url}",
                priority=severity.value,
                risk=TaskRisk.LOW.value,
                action_type="report",
                target_url=psi_result.url,
                metadata={
                    'metric': 'CLS',
                    'value': metrics.cls,
                    'threshold': thresholds['cls_good'],
                    'device': psi_result.device
                }
            ))

        # INP issues
        if metrics.inp and metrics.inp > thresholds['inp_good']:
            severity = TaskPriority.HIGH if metrics.inp > thresholds['inp_needs_improvement'] else TaskPriority.MEDIUM
            tasks.append(self.create_task(
                description=f"INP too slow ({metrics.inp:.0f}ms) on {psi_result.url}",
                priority=severity.value,
                risk=TaskRisk.LOW.value,
                action_type="report",
                target_url=psi_result.url,
                metadata={
                    'metric': 'INP',
                    'value': metrics.inp,
                    'threshold': thresholds['inp_good'],
                    'device': psi_result.device
                }
            ))

        # Add top opportunities as tasks
        for opp in psi_result.opportunities[:3]:  # Top 3
            if opp.get('savings_ms', 0) > 500:  # Only significant savings
                tasks.append(self.create_task(
                    description=f"{opp['title']} on {psi_result.url}",
                    priority=TaskPriority.MEDIUM.value,
                    risk=TaskRisk.MEDIUM.value,
                    action_type="report",
                    target_url=psi_result.url,
                    metadata={
                        'opportunity': opp['id'],
                        'savings_ms': opp.get('savings_ms', 0),
                        'display_value': opp.get('display_value', '')
                    }
                ))

        return tasks

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'pages_tested': self.pages_tested,
            'pages_passing_cwv': self.pages_passing,
            'cwv_pass_rate': self.pages_passing / self.pages_tested if self.pages_tested > 0 else 0
        }
