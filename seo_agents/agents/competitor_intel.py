"""
Competitor Intelligence Agent

Monitors competitors and identifies content gaps.
"""

import time
import logging
from typing import Dict, List, Optional

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


class CompetitorIntelligenceAgent(BaseAgent):
    """
    Monitors competitors and identifies opportunities.

    Responsibilities:
    - Track top competitors
    - Analyze competitor content structure
    - Identify content gaps
    - Monitor SERP features
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.competitors_analyzed = 0
        self.gaps_found = 0

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """Analyze competitors and identify gaps."""
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info("Starting competitor analysis")

        try:
            # Get competitor domains from config
            competitors = self.get_config('competitors.direct', [])

            # Analyze content gaps based on clusters
            gap_tasks = self._identify_content_gaps(crawl_data)
            tasks.extend(gap_tasks)

            # Generate competitor feature parity report
            parity_tasks = self._check_feature_parity()
            tasks.extend(parity_tasks)

            result.tasks = tasks
            result.metrics = {
                'competitors_tracked': len(competitors),
                'content_gaps_found': self.gaps_found
            }

            result.summary = (
                f"Tracked {len(competitors)} competitors. "
                f"Found {self.gaps_found} content gap opportunities."
            )

        except Exception as e:
            result.success = False
            result.errors.append(str(e))

        result.execution_time = time.time() - start_time
        return result

    def _identify_content_gaps(self, crawl_data: Dict) -> List[Task]:
        """Identify content gaps compared to competitors."""
        tasks = []

        # Content types competitors typically have
        expected_content = [
            ('ingredient-guides', 'Educational guides for key ingredients'),
            ('skin-type-guides', 'Content for different skin types'),
            ('routine-builders', 'Interactive routine building tools'),
            ('before-after-gallery', 'Customer transformation gallery'),
            ('ingredient-glossary', 'Comprehensive ingredient dictionary'),
        ]

        # Check what we have
        our_paths = set()
        for url in crawl_data:
            from urllib.parse import urlparse
            path = urlparse(url).path.lower()
            our_paths.add(path)

        for content_id, description in expected_content:
            has_content = any(content_id.replace('-', '') in path.replace('-', '') for path in our_paths)

            if not has_content:
                self.gaps_found += 1
                tasks.append(self.create_task(
                    description=f"Content gap: competitors have '{description}'",
                    priority=TaskPriority.LOW.value,
                    risk=TaskRisk.MINIMAL.value,
                    action_type="report",
                    metadata={
                        'content_type': content_id,
                        'description': description
                    }
                ))

        return tasks

    def _check_feature_parity(self) -> List[Task]:
        """Check feature parity with competitors."""
        tasks = []

        # Features we should have for parity
        expected_features = [
            ('quiz-skin-type', 'Skin type quiz'),
            ('rewards-program', 'Loyalty/rewards program page'),
            ('subscription-option', 'Subscribe & save option'),
        ]

        for feature_id, description in expected_features:
            # These are informational - we'd need actual crawl data to verify
            tasks.append(self.create_task(
                description=f"Verify feature parity: {description}",
                priority=TaskPriority.LOW.value,
                risk=TaskRisk.MINIMAL.value,
                action_type="report",
                metadata={'feature': feature_id}
            ))

        return tasks[:5]  # Limit

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'content_gaps_found': self.gaps_found
        }
