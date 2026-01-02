"""
SEO Commander - Orchestrator

Coordinates all SEO agents and manages the daily execution loop.
"""

import os
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict

from .agents import (
    BaseAgent,
    AgentResult,
    Task,
    TechnicalSEOAuditor,
    CWVAgent,
    SchemaAgent,
    InternalLinkingArchitect,
    KeywordIntentMapper,
    CompetitorIntelligenceAgent,
    ContentRefreshAgent,
    EEATAgent,
    AIReadinessAgent,
    SnippetPAAAgent,
    CannibalizationAgent,
    ConversionRateAgent,
    MonitoringAgent,
    GoogleMerchantCenterAgent,
)
from .tools import SiteCrawler, SitemapParser, validate_json_ld, check_forbidden_words


@dataclass
class ExecutionPlan:
    """Plan for executing SEO improvements."""
    tasks: List[Task] = field(default_factory=list)
    max_tasks: int = 5
    require_manual_review: bool = False
    blocked_tasks: List[Task] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class ExecutionResult:
    """Result of executing the daily plan."""
    success: bool
    tasks_executed: int
    tasks_blocked: int
    files_modified: List[str] = field(default_factory=list)
    patches_generated: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    rollback_required: bool = False


class SEOCommander:
    """
    Main orchestrator for the SEO agent system.

    Coordinates:
    1. CRAWL - Fetch sitemaps and crawl pages
    2. ANALYZE - Run all agents
    3. DECIDE - Prioritize and filter tasks
    4. EXECUTE - Apply changes
    5. VALIDATE - Quality gate checks
    6. MEASURE - Log metrics
    7. LEARN - Update baselines
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        self.config = config
        self.logger = logger or logging.getLogger(__name__)
        self.run_date = datetime.utcnow().strftime('%Y-%m-%d')
        self.dry_run = False

        # Initialize paths
        self.runs_dir = os.path.join(
            config.get('output', {}).get('runs_directory', 'runs'),
            self.run_date
        )
        self.reports_dir = config.get('output', {}).get('reports_directory', 'reports')
        self.patches_dir = config.get('output', {}).get('patches_directory', 'reports/patches')

        # Crawl data storage
        self.crawl_data: Dict = {}

        # Agent results
        self.agent_results: Dict[str, AgentResult] = {}

        # All tasks from all agents
        self.all_tasks: List[Task] = []

        # Initialize agents
        self.agents: Dict[str, BaseAgent] = {}
        self._initialize_agents()

    def _initialize_agents(self) -> None:
        """Initialize all SEO agents."""
        agent_classes = [
            ('technical', TechnicalSEOAuditor),
            ('cwv', CWVAgent),
            ('schema', SchemaAgent),
            ('internal_linking', InternalLinkingArchitect),
            ('keyword_mapper', KeywordIntentMapper),
            ('competitor', CompetitorIntelligenceAgent),
            ('content_refresh', ContentRefreshAgent),
            ('eeat', EEATAgent),
            ('ai_readiness', AIReadinessAgent),
            ('snippet', SnippetPAAAgent),
            ('cannibalization', CannibalizationAgent),
            ('cro', ConversionRateAgent),
            ('monitoring', MonitoringAgent),
            ('gmc', GoogleMerchantCenterAgent),
        ]

        for name, agent_class in agent_classes:
            try:
                self.agents[name] = agent_class(self.config, self.logger)
                self.logger.info(f"Initialized agent: {name}")
            except Exception as e:
                self.logger.error(f"Failed to initialize agent {name}: {e}")

    def run(self, dry_run: bool = False) -> Dict:
        """
        Execute the full daily SEO loop.

        Args:
            dry_run: If True, don't make any changes

        Returns:
            Summary of the run
        """
        self.dry_run = dry_run
        start_time = time.time()

        self.logger.info(f"Starting SEO run for {self.run_date} (dry_run={dry_run})")

        # Create output directories
        os.makedirs(self.runs_dir, exist_ok=True)
        os.makedirs(self.reports_dir, exist_ok=True)
        os.makedirs(self.patches_dir, exist_ok=True)

        try:
            # Phase 1: CRAWL
            self.logger.info("Phase 1: CRAWL")
            self._crawl_phase()

            # Phase 2: ANALYZE
            self.logger.info("Phase 2: ANALYZE")
            self._analyze_phase()

            # Phase 3: DECIDE
            self.logger.info("Phase 3: DECIDE")
            plan = self._decide_phase()

            # Phase 4: EXECUTE
            self.logger.info("Phase 4: EXECUTE")
            exec_result = self._execute_phase(plan)

            # Phase 5: VALIDATE
            self.logger.info("Phase 5: VALIDATE")
            validation_passed = self._validate_phase(exec_result)

            # Phase 6: MEASURE
            self.logger.info("Phase 6: MEASURE")
            metrics = self._measure_phase()

            # Phase 7: LEARN
            self.logger.info("Phase 7: LEARN")
            self._learn_phase()

            # Generate summary report
            summary = self._generate_summary(exec_result, metrics, validation_passed)

            # Save run artifacts
            self._save_artifacts(summary, plan, exec_result)

            total_time = time.time() - start_time
            self.logger.info(f"SEO run completed in {total_time:.1f}s")

            return summary

        except Exception as e:
            self.logger.error(f"SEO run failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'run_date': self.run_date
            }

    def _crawl_phase(self) -> None:
        """Phase 1: Crawl sites and collect data."""
        domains = [
            (self.config.get('domains', {}).get('app'), 'app'),
            (self.config.get('domains', {}).get('primary'), 'primary'),
        ]

        for domain, domain_type in domains:
            if not domain:
                continue

            base_url = f"https://{domain}"
            self.logger.info(f"Crawling {base_url}...")

            try:
                crawler = SiteCrawler(
                    base_url=base_url,
                    rate_limit_seconds=self.config.get('limits', {}).get('rate_limit_seconds', 1),
                    max_pages=self.config.get('limits', {}).get('max_pages_crawl', 100)
                )

                # Get priority URLs from config
                priority_paths = self.config.get('priority_pages', {}).get(domain_type, [])
                start_urls = [f"{base_url}{path}" for path in priority_paths]

                # Crawl
                results = crawler.crawl_site(start_urls or None)

                # Store results
                for url, result in results.items():
                    self.crawl_data[url] = result

                self.logger.info(f"Crawled {len(results)} pages from {domain}")

            except Exception as e:
                self.logger.error(f"Crawl failed for {domain}: {e}")

        # Save crawl data
        self._save_crawl_data()

    def _analyze_phase(self) -> None:
        """Phase 2: Run all agents."""
        for name, agent in self.agents.items():
            try:
                self.logger.info(f"Running agent: {name}")
                result = agent.analyze(self.crawl_data)
                self.agent_results[name] = result

                # Collect tasks
                self.all_tasks.extend(result.tasks)

                self.logger.info(
                    f"Agent {name} completed: {len(result.tasks)} tasks, "
                    f"success={result.success}"
                )

            except Exception as e:
                self.logger.error(f"Agent {name} failed: {e}")
                self.agent_results[name] = AgentResult(
                    agent_name=name,
                    success=False,
                    errors=[str(e)]
                )

        # Save agent reports
        self._save_agent_reports()

    def _decide_phase(self) -> ExecutionPlan:
        """Phase 3: Prioritize and filter tasks."""
        plan = ExecutionPlan()
        max_changes = self.config.get('limits', {}).get('max_changes_per_day', 5)
        plan.max_tasks = max_changes

        # Sort tasks by score (priority * 0.6 + (100 - risk) * 0.4)
        sorted_tasks = sorted(self.all_tasks, key=lambda t: t.score, reverse=True)

        # Filter tasks
        for task in sorted_tasks:
            # Check risk threshold
            if task.risk > 70:
                plan.blocked_tasks.append(task)
                continue

            # Check if we've hit the limit
            if len(plan.tasks) >= max_changes:
                plan.require_manual_review = True
                break

            plan.tasks.append(task)

        self.logger.info(
            f"Decision phase: {len(plan.tasks)} tasks to execute, "
            f"{len(plan.blocked_tasks)} blocked, "
            f"manual_review={plan.require_manual_review}"
        )

        return plan

    def _execute_phase(self, plan: ExecutionPlan) -> ExecutionResult:
        """Phase 4: Execute approved tasks."""
        result = ExecutionResult(success=True, tasks_executed=0, tasks_blocked=len(plan.blocked_tasks))

        if self.dry_run:
            self.logger.info("Dry run - skipping execution")
            return result

        if plan.require_manual_review:
            self.logger.warning("Manual review required - only generating reports")
            result.warnings.append("Too many changes - manual review required")
            return result

        for task in plan.tasks:
            try:
                executed = self._execute_task(task)
                if executed:
                    result.tasks_executed += 1
                    if task.target_file:
                        result.files_modified.append(task.target_file)
                    task.executed = True
                    task.execution_result = "success"

            except Exception as e:
                self.logger.error(f"Task execution failed: {e}")
                result.errors.append(f"Task {task.id}: {str(e)}")
                task.execution_result = f"error: {str(e)}"

        return result

    def _execute_task(self, task: Task) -> bool:
        """Execute a single task."""
        self.logger.info(f"Executing task: {task.id} - {task.description}")

        # For now, we only generate patches/reports rather than direct modifications
        # Direct file modification would go here for the ai.ayonne.skin Next.js app

        if task.action_type == 'report':
            # Just log it
            return True

        elif task.action_type == 'modify' and task.target_url:
            # Generate patch for Shopify pages
            if 'ayonne.skin' in task.target_url and 'ai.' not in task.target_url:
                self._generate_patch(task)
                return True

            # For ai.ayonne.skin, we could modify files directly
            # This would require mapping URLs to file paths
            return True

        elif task.action_type == 'create':
            # Generate creation instruction
            self._generate_patch(task)
            return True

        return False

    def _generate_patch(self, task: Task) -> None:
        """Generate a patch file for manual or CMS application."""
        patch_file = os.path.join(
            self.patches_dir,
            f"{self.run_date}_{task.id}.json"
        )

        patch_data = {
            'task_id': task.id,
            'description': task.description,
            'action_type': task.action_type,
            'target_url': task.target_url,
            'changes': task.changes,
            'metadata': task.metadata,
            'generated_at': datetime.utcnow().isoformat()
        }

        with open(patch_file, 'w') as f:
            json.dump(patch_data, f, indent=2)

        self.logger.info(f"Generated patch: {patch_file}")

    def _validate_phase(self, exec_result: ExecutionResult) -> bool:
        """Phase 5: Validate changes pass quality gates."""
        passed = True

        # Check forbidden words in any generated content
        forbidden = self.config.get('forbidden_words', [])
        allowed_disclaimers = self.config.get('allowed_disclaimers', [])

        for file_path in exec_result.files_modified:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()

                    result = check_forbidden_words(content, forbidden, allowed_disclaimers)
                    if not result.passed:
                        passed = False
                        exec_result.errors.extend(result.errors)
                        self.logger.error(f"Forbidden words in {file_path}")

                except Exception as e:
                    self.logger.error(f"Validation error for {file_path}: {e}")

        # Check change count
        max_changes = self.config.get('limits', {}).get('max_file_modifications', 5)
        if len(exec_result.files_modified) > max_changes:
            passed = False
            exec_result.errors.append(f"Too many files modified: {len(exec_result.files_modified)}")

        return passed

    def _measure_phase(self) -> Dict:
        """Phase 6: Collect and log metrics."""
        metrics = {
            'run_date': self.run_date,
            'pages_crawled': len(self.crawl_data),
            'total_tasks': len(self.all_tasks),
            'agents': {}
        }

        for name, result in self.agent_results.items():
            metrics['agents'][name] = result.metrics

        # Aggregate KPIs
        all_kpis = {}
        for name, agent in self.agents.items():
            try:
                kpis = agent.get_kpis()
                all_kpis[name] = kpis
            except Exception:
                pass

        metrics['kpis'] = all_kpis

        return metrics

    def _learn_phase(self) -> None:
        """Phase 7: Update baselines and store patterns."""
        # Store successful patterns for future reference
        # This is a placeholder for more sophisticated learning

        successful_tasks = [
            t.to_dict() for t in self.all_tasks
            if t.executed and t.execution_result == 'success'
        ]

        if successful_tasks:
            patterns_file = os.path.join(self.reports_dir, 'successful_patterns.json')

            existing = []
            if os.path.exists(patterns_file):
                try:
                    with open(patterns_file, 'r') as f:
                        existing = json.load(f)
                except Exception:
                    pass

            # Keep last 100 patterns
            existing.extend(successful_tasks)
            existing = existing[-100:]

            with open(patterns_file, 'w') as f:
                json.dump(existing, f, indent=2)

    def _generate_summary(
        self,
        exec_result: ExecutionResult,
        metrics: Dict,
        validation_passed: bool
    ) -> Dict:
        """Generate summary report."""
        summary = {
            'success': exec_result.success and validation_passed,
            'run_date': self.run_date,
            'dry_run': self.dry_run,
            'pages_crawled': len(self.crawl_data),
            'agents_run': len(self.agent_results),
            'total_tasks_found': len(self.all_tasks),
            'tasks_executed': exec_result.tasks_executed,
            'tasks_blocked': exec_result.tasks_blocked,
            'files_modified': exec_result.files_modified,
            'patches_generated': len([
                f for f in os.listdir(self.patches_dir)
                if f.startswith(self.run_date)
            ]) if os.path.exists(self.patches_dir) else 0,
            'validation_passed': validation_passed,
            'errors': exec_result.errors,
            'warnings': exec_result.warnings,
            'metrics': metrics
        }

        # Generate markdown summary
        self._generate_markdown_summary(summary)

        return summary

    def _generate_markdown_summary(self, summary: Dict) -> None:
        """Generate human-readable markdown summary."""
        md = f"""# SEO Agent Run Summary - {self.run_date}

## Overview
- **Status**: {'SUCCESS' if summary['success'] else 'FAILED'}
- **Mode**: {'Dry Run' if summary['dry_run'] else 'Live'}
- **Pages Crawled**: {summary['pages_crawled']}
- **Agents Run**: {summary['agents_run']}

## Tasks
- **Total Found**: {summary['total_tasks_found']}
- **Executed**: {summary['tasks_executed']}
- **Blocked**: {summary['tasks_blocked']}

## Changes
- **Files Modified**: {len(summary['files_modified'])}
- **Patches Generated**: {summary['patches_generated']}

## Validation
- **Passed**: {'Yes' if summary['validation_passed'] else 'No'}

"""

        if summary['errors']:
            md += "## Errors\n"
            for error in summary['errors']:
                md += f"- {error}\n"
            md += "\n"

        if summary['warnings']:
            md += "## Warnings\n"
            for warning in summary['warnings']:
                md += f"- {warning}\n"
            md += "\n"

        # Agent summaries
        md += "## Agent Results\n"
        for name, result in self.agent_results.items():
            status = 'OK' if result.success else 'FAILED'
            md += f"- **{name}**: {status} - {len(result.tasks)} tasks\n"

        md += f"\n---\n*Generated at {datetime.utcnow().isoformat()}*\n"

        # Save summary
        summary_path = os.path.join(self.reports_dir, 'summary.md')
        with open(summary_path, 'w') as f:
            f.write(md)

        self.logger.info(f"Summary written to {summary_path}")

    def _save_crawl_data(self) -> None:
        """Save crawl data to file."""
        crawl_file = os.path.join(self.runs_dir, 'crawl_data.json')

        # Convert crawl results to serializable format
        data = {}
        for url, result in self.crawl_data.items():
            data[url] = {
                'url': result.url,
                'status_code': result.status_code,
                'title': result.title,
                'description': result.description,
                'h1': result.h1,
                'canonical': result.canonical,
                'robots_meta': result.robots_meta,
                'word_count': result.word_count,
                'internal_links': len(result.internal_links),
                'external_links': len(result.external_links),
                'images': len(result.images),
                'schema_types': [
                    s.get('@type', '') for s in result.schema_data
                    if isinstance(s, dict)
                ],
                'error': result.error
            }

        with open(crawl_file, 'w') as f:
            json.dump(data, f, indent=2)

    def _save_agent_reports(self) -> None:
        """Save individual agent reports."""
        reports_dir = os.path.join(self.runs_dir, 'agent_reports')
        os.makedirs(reports_dir, exist_ok=True)

        for name, result in self.agent_results.items():
            report_file = os.path.join(reports_dir, f'{name}.json')
            with open(report_file, 'w') as f:
                json.dump(result.to_dict(), f, indent=2)

    def _save_artifacts(
        self,
        summary: Dict,
        plan: ExecutionPlan,
        exec_result: ExecutionResult
    ) -> None:
        """Save all run artifacts."""
        # Save summary
        summary_file = os.path.join(self.runs_dir, 'summary.json')
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)

        # Save execution plan
        plan_file = os.path.join(self.runs_dir, 'execution_plan.json')
        with open(plan_file, 'w') as f:
            json.dump({
                'tasks': [t.to_dict() for t in plan.tasks],
                'blocked_tasks': [t.to_dict() for t in plan.blocked_tasks],
                'max_tasks': plan.max_tasks,
                'require_manual_review': plan.require_manual_review
            }, f, indent=2)

        # Save all tasks
        tasks_file = os.path.join(self.runs_dir, 'all_tasks.json')
        with open(tasks_file, 'w') as f:
            json.dump([t.to_dict() for t in self.all_tasks], f, indent=2)

        self.logger.info(f"Artifacts saved to {self.runs_dir}")
