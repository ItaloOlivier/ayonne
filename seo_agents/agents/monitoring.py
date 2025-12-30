"""
Monitoring & Alerts Agent

Tracks changes, detects anomalies, and generates alerts.
"""

import time
import json
import os
import logging
from typing import Dict, List, Optional
from datetime import datetime

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


class MonitoringAgent(BaseAgent):
    """
    Monitors site health and detects anomalies.

    Responsibilities:
    - Track crawl errors
    - Monitor indexation changes
    - Alert on rank drops (if GSC data available)
    - Detect anomalies
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.anomalies_detected = 0
        self.alerts_generated = 0

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """Monitor site health and detect anomalies."""
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info(f"Monitoring {len(crawl_data)} pages for anomalies")

        try:
            # Load previous run data for comparison
            previous_data = self._load_previous_run()

            # Check for significant changes
            if previous_data:
                change_tasks = self._detect_changes(crawl_data, previous_data)
                tasks.extend(change_tasks)

            # Check for crawl errors
            error_tasks = self._check_crawl_errors(crawl_data)
            tasks.extend(error_tasks)

            # Check for new noindex pages
            noindex_tasks = self._check_noindex_changes(crawl_data, previous_data)
            tasks.extend(noindex_tasks)

            # Save current run for next comparison
            self._save_current_run(crawl_data)

            result.tasks = tasks
            result.metrics = {
                'anomalies_detected': self.anomalies_detected,
                'alerts_generated': self.alerts_generated,
                'error_pages': sum(1 for p in crawl_data.values() if hasattr(p, 'status_code') and p.status_code >= 400),
                'pages_monitored': len(crawl_data)
            }

            result.summary = (
                f"Monitored {len(crawl_data)} pages. "
                f"Detected {self.anomalies_detected} anomalies. "
                f"Generated {self.alerts_generated} alerts."
            )

        except Exception as e:
            result.success = False
            result.errors.append(str(e))

        result.execution_time = time.time() - start_time
        return result

    def _load_previous_run(self) -> Optional[Dict]:
        """Load previous run data for comparison."""
        runs_dir = self.get_config('output.runs_directory', 'runs')
        metrics_file = os.path.join(runs_dir, 'latest_metrics.json')

        if os.path.exists(metrics_file):
            try:
                with open(metrics_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                self.log_warning(f"Could not load previous metrics: {e}")

        return None

    def _save_current_run(self, crawl_data: Dict) -> None:
        """Save current run metrics for next comparison."""
        runs_dir = self.get_config('output.runs_directory', 'runs')
        os.makedirs(runs_dir, exist_ok=True)

        metrics = {
            'timestamp': datetime.utcnow().isoformat(),
            'page_count': len(crawl_data),
            'pages': {}
        }

        for url, page in crawl_data.items():
            metrics['pages'][url] = {
                'status_code': getattr(page, 'status_code', 0),
                'title': getattr(page, 'title', ''),
                'robots': getattr(page, 'robots_meta', ''),
            }

        try:
            metrics_file = os.path.join(runs_dir, 'latest_metrics.json')
            with open(metrics_file, 'w') as f:
                json.dump(metrics, f, indent=2)
        except Exception as e:
            self.log_warning(f"Could not save metrics: {e}")

    def _detect_changes(self, current: Dict, previous: Dict) -> List[Task]:
        """Detect significant changes from previous run."""
        tasks = []
        previous_pages = previous.get('pages', {})

        # Check for new 404s
        for url, page in current.items():
            status = getattr(page, 'status_code', 200)
            prev_status = previous_pages.get(url, {}).get('status_code', 200)

            if status >= 400 and prev_status < 400:
                self.anomalies_detected += 1
                self.alerts_generated += 1
                tasks.append(self.create_task(
                    description=f"Page started returning {status}: {url}",
                    priority=TaskPriority.HIGH.value,
                    risk=TaskRisk.LOW.value,
                    action_type="report",
                    target_url=url,
                    metadata={
                        'previous_status': prev_status,
                        'current_status': status,
                        'alert': True
                    }
                ))

        # Check for page count drop
        prev_count = previous.get('page_count', 0)
        curr_count = len(current)
        if prev_count > 0:
            drop_pct = (prev_count - curr_count) / prev_count
            if drop_pct > 0.1:  # >10% drop
                self.anomalies_detected += 1
                self.alerts_generated += 1
                tasks.append(self.create_task(
                    description=f"Page count dropped by {drop_pct:.0%} ({prev_count} -> {curr_count})",
                    priority=TaskPriority.HIGH.value,
                    risk=TaskRisk.LOW.value,
                    action_type="report",
                    metadata={
                        'previous_count': prev_count,
                        'current_count': curr_count,
                        'alert': True
                    }
                ))

        return tasks

    def _check_crawl_errors(self, crawl_data: Dict) -> List[Task]:
        """Check for crawl errors."""
        tasks = []
        error_pages = []

        for url, page in crawl_data.items():
            status = getattr(page, 'status_code', 200)
            error = getattr(page, 'error', None)

            if status >= 400 or error:
                error_pages.append((url, status, error))

        # Report if significant errors
        if len(error_pages) > len(crawl_data) * 0.05:  # >5% errors
            self.anomalies_detected += 1
            tasks.append(self.create_task(
                description=f"High error rate: {len(error_pages)} pages ({len(error_pages)/len(crawl_data):.0%})",
                priority=TaskPriority.HIGH.value,
                risk=TaskRisk.LOW.value,
                action_type="report",
                metadata={
                    'error_count': len(error_pages),
                    'sample_errors': error_pages[:5]
                }
            ))

        return tasks

    def _check_noindex_changes(self, current: Dict, previous: Optional[Dict]) -> List[Task]:
        """Check for new noindex directives."""
        tasks = []
        if not previous:
            return tasks

        previous_pages = previous.get('pages', {})

        for url, page in current.items():
            robots = getattr(page, 'robots_meta', '') or ''
            prev_robots = previous_pages.get(url, {}).get('robots', '') or ''

            if 'noindex' in robots.lower() and 'noindex' not in prev_robots.lower():
                self.anomalies_detected += 1
                self.alerts_generated += 1
                tasks.append(self.create_task(
                    description=f"Page newly set to noindex: {url}",
                    priority=TaskPriority.HIGH.value,
                    risk=TaskRisk.LOW.value,
                    action_type="report",
                    target_url=url,
                    metadata={'alert': True}
                ))

        return tasks

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'anomalies_detected': self.anomalies_detected,
            'alerts_generated': self.alerts_generated
        }
