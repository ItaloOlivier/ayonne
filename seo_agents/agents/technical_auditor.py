"""
Technical SEO Auditor Agent

Audits technical SEO elements: robots.txt, sitemaps, canonicals,
redirects, meta robots, and indexation signals.
"""

import time
import logging
from typing import Dict, List, Optional, Set
from urllib.parse import urlparse, urljoin

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk
from ..tools.sitemap import SitemapParser, discover_sitemaps
from ..tools.crawler import CrawlResult


class TechnicalSEOAuditor(BaseAgent):
    """
    Audits technical SEO elements.

    Responsibilities:
    - Parse robots.txt and sitemaps
    - Check canonical tags
    - Detect redirect chains
    - Find broken internal links
    - Check meta robots tags
    - Verify indexation signals
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.issues_found = 0
        self.pages_audited = 0

    def analyze(self, crawl_data: Dict[str, CrawlResult], **kwargs) -> AgentResult:
        """
        Run technical SEO audit.

        Args:
            crawl_data: Dictionary mapping URLs to CrawlResult objects

        Returns:
            AgentResult with technical issues and tasks
        """
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info(f"Starting technical audit of {len(crawl_data)} pages")

        try:
            # Audit robots.txt
            robots_tasks = self._audit_robots_txt()
            tasks.extend(robots_tasks)

            # Audit sitemaps
            sitemap_tasks = self._audit_sitemaps(crawl_data)
            tasks.extend(sitemap_tasks)

            # Audit each page
            for url, page_data in crawl_data.items():
                page_tasks = self._audit_page(url, page_data, crawl_data)
                tasks.extend(page_tasks)
                self.pages_audited += 1

            # Check for orphan pages
            orphan_tasks = self._find_orphan_pages(crawl_data)
            tasks.extend(orphan_tasks)

            # Check for redirect chains
            redirect_tasks = self._check_redirect_chains(crawl_data)
            tasks.extend(redirect_tasks)

            result.tasks = tasks
            self.issues_found = len(tasks)

            result.metrics = {
                'pages_audited': self.pages_audited,
                'issues_found': self.issues_found,
                'critical_issues': sum(1 for t in tasks if t.priority >= TaskPriority.HIGH.value),
                'medium_issues': sum(1 for t in tasks if TaskPriority.MEDIUM.value <= t.priority < TaskPriority.HIGH.value),
                'low_issues': sum(1 for t in tasks if t.priority < TaskPriority.MEDIUM.value),
            }

            result.summary = (
                f"Audited {self.pages_audited} pages. "
                f"Found {self.issues_found} issues "
                f"({result.metrics['critical_issues']} critical)."
            )

        except Exception as e:
            result.success = False
            result.errors.append(f"Audit failed: {str(e)}")
            self.log_error(f"Technical audit failed: {e}")

        result.execution_time = time.time() - start_time
        return result

    def _audit_robots_txt(self) -> List[Task]:
        """Audit robots.txt file."""
        tasks = []
        domains = [
            self.get_config('domains.primary'),
            self.get_config('domains.app')
        ]

        for domain in domains:
            if not domain:
                continue

            protocol = self.get_config(f'domains.{domain.replace(".", "_")}_protocol', 'https')
            base_url = f"{protocol}://{domain}"

            try:
                import requests
                response = requests.get(f"{base_url}/robots.txt", timeout=10)

                if response.status_code == 404:
                    tasks.append(self.create_task(
                        description=f"Missing robots.txt on {domain}",
                        priority=TaskPriority.HIGH.value,
                        risk=TaskRisk.LOW.value,
                        action_type="create",
                        target_url=f"{base_url}/robots.txt",
                        metadata={'domain': domain}
                    ))
                elif response.status_code == 200:
                    content = response.text.lower()

                    # Check for dangerous directives
                    if 'disallow: /' in content and 'disallow: /api' not in content:
                        # Check if it's blocking everything
                        lines = [l.strip() for l in content.split('\n')]
                        for i, line in enumerate(lines):
                            if line == 'disallow: /':
                                # Check if previous line is user-agent: *
                                if i > 0 and 'user-agent: *' in lines[i-1]:
                                    tasks.append(self.create_task(
                                        description=f"robots.txt on {domain} may be blocking all crawlers",
                                        priority=TaskPriority.CRITICAL.value,
                                        risk=TaskRisk.HIGH.value,
                                        action_type="report",
                                        target_url=f"{base_url}/robots.txt",
                                        metadata={'domain': domain, 'issue': 'blocking_all'}
                                    ))

                    # Check for sitemap reference
                    if 'sitemap:' not in content:
                        tasks.append(self.create_task(
                            description=f"robots.txt on {domain} missing sitemap reference",
                            priority=TaskPriority.MEDIUM.value,
                            risk=TaskRisk.MINIMAL.value,
                            action_type="modify",
                            target_url=f"{base_url}/robots.txt",
                            changes={'add': f'Sitemap: {base_url}/sitemap.xml'},
                            metadata={'domain': domain}
                        ))

            except Exception as e:
                self.log_warning(f"Could not fetch robots.txt for {domain}: {e}")

        return tasks

    def _audit_sitemaps(self, crawl_data: Dict) -> List[Task]:
        """Audit sitemap files."""
        tasks = []
        parser = SitemapParser()

        primary_sitemap = self.get_config('sitemaps.primary')
        app_sitemap = self.get_config('sitemaps.app')

        for sitemap_url in [primary_sitemap, app_sitemap]:
            if not sitemap_url:
                continue

            try:
                urls = parser.parse(sitemap_url)

                if not urls:
                    tasks.append(self.create_task(
                        description=f"Empty or invalid sitemap: {sitemap_url}",
                        priority=TaskPriority.HIGH.value,
                        risk=TaskRisk.LOW.value,
                        action_type="report",
                        target_url=sitemap_url
                    ))
                    continue

                # Check for sitemap issues
                sitemap_urls = {u.loc for u in urls}
                crawled_urls = set(crawl_data.keys())

                # URLs in sitemap but returning errors
                for url in list(sitemap_urls)[:50]:  # Check first 50
                    if url in crawl_data:
                        page = crawl_data[url]
                        if page.status_code >= 400:
                            tasks.append(self.create_task(
                                description=f"Sitemap contains error page ({page.status_code}): {url}",
                                priority=TaskPriority.MEDIUM.value,
                                risk=TaskRisk.LOW.value,
                                action_type="report",
                                target_url=url,
                                metadata={'status_code': page.status_code}
                            ))

                self.log_info(f"Parsed {len(urls)} URLs from {sitemap_url}")

            except Exception as e:
                tasks.append(self.create_task(
                    description=f"Failed to parse sitemap: {sitemap_url}",
                    priority=TaskPriority.HIGH.value,
                    risk=TaskRisk.LOW.value,
                    action_type="report",
                    target_url=sitemap_url,
                    metadata={'error': str(e)}
                ))

        return tasks

    def _audit_page(self, url: str, page: CrawlResult, all_pages: Dict) -> List[Task]:
        """Audit a single page for technical issues."""
        tasks = []

        # Skip error pages
        if page.status_code >= 400:
            return tasks

        # Check title
        if not page.title:
            tasks.append(self.create_task(
                description=f"Missing title tag: {url}",
                priority=TaskPriority.HIGH.value,
                risk=TaskRisk.LOW.value,
                action_type="modify",
                target_url=url,
                changes={'element': 'title', 'action': 'add'}
            ))
        elif len(page.title) > 60:
            tasks.append(self.create_task(
                description=f"Title too long ({len(page.title)} chars): {url}",
                priority=TaskPriority.LOW.value,
                risk=TaskRisk.MINIMAL.value,
                action_type="modify",
                target_url=url,
                changes={'element': 'title', 'action': 'shorten', 'current_length': len(page.title)}
            ))

        # Check meta description
        if not page.description:
            tasks.append(self.create_task(
                description=f"Missing meta description: {url}",
                priority=TaskPriority.MEDIUM.value,
                risk=TaskRisk.LOW.value,
                action_type="modify",
                target_url=url,
                changes={'element': 'meta_description', 'action': 'add'}
            ))
        elif len(page.description) > 160:
            tasks.append(self.create_task(
                description=f"Meta description too long ({len(page.description)} chars): {url}",
                priority=TaskPriority.LOW.value,
                risk=TaskRisk.MINIMAL.value,
                action_type="modify",
                target_url=url,
                changes={'element': 'meta_description', 'action': 'shorten'}
            ))

        # Check H1
        if not page.h1:
            tasks.append(self.create_task(
                description=f"Missing H1 tag: {url}",
                priority=TaskPriority.MEDIUM.value,
                risk=TaskRisk.LOW.value,
                action_type="modify",
                target_url=url,
                changes={'element': 'h1', 'action': 'add'}
            ))

        # Check canonical
        if page.canonical:
            # Self-referencing canonical should match URL
            canonical_parsed = urlparse(page.canonical)
            url_parsed = urlparse(url)

            if canonical_parsed.path != url_parsed.path:
                # Non-self-referencing canonical - might be intentional
                if canonical_parsed.netloc == url_parsed.netloc:
                    tasks.append(self.create_task(
                        description=f"Canonical points to different page: {url} -> {page.canonical}",
                        priority=TaskPriority.LOW.value,
                        risk=TaskRisk.MEDIUM.value,
                        action_type="report",
                        target_url=url,
                        metadata={'canonical': page.canonical}
                    ))

        # Check robots meta
        if page.robots_meta:
            robots_lower = page.robots_meta.lower()
            if 'noindex' in robots_lower:
                # This might be intentional for certain pages
                tasks.append(self.create_task(
                    description=f"Page has noindex directive: {url}",
                    priority=TaskPriority.LOW.value,
                    risk=TaskRisk.MEDIUM.value,
                    action_type="report",
                    target_url=url,
                    metadata={'robots': page.robots_meta}
                ))

        return tasks

    def _find_orphan_pages(self, crawl_data: Dict[str, CrawlResult]) -> List[Task]:
        """Find pages with no internal links pointing to them."""
        tasks = []

        # Build set of all linked pages
        linked_pages: Set[str] = set()
        for page in crawl_data.values():
            for link in page.internal_links:
                # Normalize URL
                parsed = urlparse(link)
                normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip('/')
                linked_pages.add(normalized)

        # Find orphans
        for url in crawl_data:
            parsed = urlparse(url)
            normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip('/')

            # Skip homepage
            if parsed.path in ('', '/'):
                continue

            if normalized not in linked_pages:
                tasks.append(self.create_task(
                    description=f"Orphan page (no internal links): {url}",
                    priority=TaskPriority.MEDIUM.value,
                    risk=TaskRisk.LOW.value,
                    action_type="report",
                    target_url=url,
                    metadata={'issue': 'orphan_page'}
                ))

        return tasks

    def _check_redirect_chains(self, crawl_data: Dict) -> List[Task]:
        """Check for redirect chains (requires following redirects)."""
        # This is a placeholder - would need actual redirect following
        # to detect chains properly
        return []

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'pages_audited': self.pages_audited,
            'issues_found': self.issues_found,
            'issues_per_page': self.issues_found / self.pages_audited if self.pages_audited > 0 else 0
        }
