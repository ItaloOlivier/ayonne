"""
Site Crawler

Crawls websites respecting robots.txt and rate limits.
"""

import time
import logging
from typing import Dict, List, Optional, Set
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass, field
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from ratelimit import limits, sleep_and_retry

logger = logging.getLogger(__name__)


@dataclass
class CrawlResult:
    """Result of crawling a single page."""
    url: str
    status_code: int
    title: Optional[str] = None
    description: Optional[str] = None
    h1: Optional[str] = None
    canonical: Optional[str] = None
    robots_meta: Optional[str] = None
    internal_links: List[str] = field(default_factory=list)
    external_links: List[str] = field(default_factory=list)
    images: List[Dict] = field(default_factory=list)
    schema_data: List[Dict] = field(default_factory=list)
    word_count: int = 0
    crawl_time: float = 0.0
    error: Optional[str] = None
    html: Optional[str] = None


class SiteCrawler:
    """
    Crawls websites with rate limiting and robots.txt respect.
    """

    def __init__(
        self,
        base_url: str,
        rate_limit_seconds: float = 1.0,
        max_pages: int = 100,
        user_agent: str = "AyonneSEOBot/1.0 (+https://ai.ayonne.skin)"
    ):
        self.base_url = base_url.rstrip('/')
        self.rate_limit_seconds = rate_limit_seconds
        self.max_pages = max_pages
        self.user_agent = user_agent
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })
        self.crawled_urls: Set[str] = set()
        self.results: Dict[str, CrawlResult] = {}
        self.robots_rules: Dict[str, bool] = {}
        self._load_robots_txt()

    def _load_robots_txt(self) -> None:
        """Load and parse robots.txt."""
        try:
            robots_url = f"{self.base_url}/robots.txt"
            response = self.session.get(robots_url, timeout=10)
            if response.status_code == 200:
                self._parse_robots_txt(response.text)
            logger.info(f"Loaded robots.txt from {robots_url}")
        except Exception as e:
            logger.warning(f"Could not load robots.txt: {e}")

    def _parse_robots_txt(self, content: str) -> None:
        """Parse robots.txt content (simplified parser)."""
        current_agent = None
        for line in content.split('\n'):
            line = line.strip().lower()
            if line.startswith('user-agent:'):
                agent = line.split(':', 1)[1].strip()
                if agent == '*' or 'seo' in agent or 'bot' in agent:
                    current_agent = agent
            elif current_agent and line.startswith('disallow:'):
                path = line.split(':', 1)[1].strip()
                if path:
                    self.robots_rules[path] = False
            elif current_agent and line.startswith('allow:'):
                path = line.split(':', 1)[1].strip()
                if path:
                    self.robots_rules[path] = True

    def is_allowed(self, url: str) -> bool:
        """Check if URL is allowed by robots.txt."""
        parsed = urlparse(url)
        path = parsed.path

        # Check specific rules first (longer paths take precedence)
        sorted_rules = sorted(self.robots_rules.keys(), key=len, reverse=True)
        for rule_path in sorted_rules:
            if path.startswith(rule_path):
                return self.robots_rules[rule_path]

        return True  # Default allow

    @sleep_and_retry
    @limits(calls=1, period=1)  # 1 request per second
    def _fetch_page(self, url: str) -> requests.Response:
        """Fetch a page with rate limiting."""
        return self.session.get(url, timeout=30)

    def crawl_page(self, url: str) -> CrawlResult:
        """Crawl a single page and extract SEO data."""
        start_time = time.time()
        result = CrawlResult(url=url, status_code=0)

        try:
            if not self.is_allowed(url):
                result.error = "Blocked by robots.txt"
                return result

            response = self._fetch_page(url)
            result.status_code = response.status_code
            result.html = response.text

            if response.status_code != 200:
                result.error = f"HTTP {response.status_code}"
                return result

            soup = BeautifulSoup(response.text, 'lxml')
            self._extract_meta(soup, result)
            self._extract_links(soup, result, url)
            self._extract_images(soup, result)
            self._extract_schema(soup, result)
            self._extract_content(soup, result)

        except requests.Timeout:
            result.error = "Timeout"
        except requests.RequestException as e:
            result.error = str(e)
        except Exception as e:
            result.error = f"Parse error: {str(e)}"
        finally:
            result.crawl_time = time.time() - start_time

        return result

    def _extract_meta(self, soup: BeautifulSoup, result: CrawlResult) -> None:
        """Extract meta tags."""
        # Title
        title_tag = soup.find('title')
        if title_tag:
            result.title = title_tag.get_text(strip=True)

        # Meta description
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        if desc_tag:
            result.description = desc_tag.get('content', '')

        # H1
        h1_tag = soup.find('h1')
        if h1_tag:
            result.h1 = h1_tag.get_text(strip=True)

        # Canonical
        canonical_tag = soup.find('link', attrs={'rel': 'canonical'})
        if canonical_tag:
            result.canonical = canonical_tag.get('href', '')

        # Robots meta
        robots_tag = soup.find('meta', attrs={'name': 'robots'})
        if robots_tag:
            result.robots_meta = robots_tag.get('content', '')

    def _extract_links(self, soup: BeautifulSoup, result: CrawlResult, current_url: str) -> None:
        """Extract internal and external links."""
        base_domain = urlparse(self.base_url).netloc

        for link in soup.find_all('a', href=True):
            href = link.get('href', '').strip()
            if not href or href.startswith('#') or href.startswith('javascript:'):
                continue

            # Resolve relative URLs
            full_url = urljoin(current_url, href)
            parsed = urlparse(full_url)

            # Skip non-http(s) URLs
            if parsed.scheme not in ('http', 'https'):
                continue

            if parsed.netloc == base_domain or parsed.netloc == '':
                result.internal_links.append(full_url)
            else:
                result.external_links.append(full_url)

    def _extract_images(self, soup: BeautifulSoup, result: CrawlResult) -> None:
        """Extract image data."""
        for img in soup.find_all('img'):
            img_data = {
                'src': img.get('src', ''),
                'alt': img.get('alt', ''),
                'loading': img.get('loading', ''),
                'width': img.get('width', ''),
                'height': img.get('height', '')
            }
            if img_data['src']:
                result.images.append(img_data)

    def _extract_schema(self, soup: BeautifulSoup, result: CrawlResult) -> None:
        """Extract JSON-LD structured data."""
        import json
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                data = json.loads(script.string)
                result.schema_data.append(data)
            except (json.JSONDecodeError, TypeError):
                pass

    def _extract_content(self, soup: BeautifulSoup, result: CrawlResult) -> None:
        """Extract and analyze main content."""
        # Remove script, style, nav, footer
        for tag in soup.find_all(['script', 'style', 'nav', 'footer', 'header']):
            tag.decompose()

        # Get main content
        main = soup.find('main') or soup.find('article') or soup.body
        if main:
            text = main.get_text(separator=' ', strip=True)
            result.word_count = len(text.split())

    def crawl_site(self, start_urls: Optional[List[str]] = None) -> Dict[str, CrawlResult]:
        """
        Crawl the site starting from given URLs or homepage.

        Args:
            start_urls: List of URLs to start crawling from

        Returns:
            Dictionary mapping URLs to CrawlResults
        """
        if start_urls is None:
            start_urls = [self.base_url]

        to_crawl = list(start_urls)

        while to_crawl and len(self.crawled_urls) < self.max_pages:
            url = to_crawl.pop(0)

            # Normalize URL
            parsed = urlparse(url)
            url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
            if url.endswith('/') and len(parsed.path) > 1:
                url = url.rstrip('/')

            if url in self.crawled_urls:
                continue

            logger.info(f"Crawling: {url}")
            result = self.crawl_page(url)
            self.crawled_urls.add(url)
            self.results[url] = result

            # Add new internal links to queue
            if result.status_code == 200:
                for link in result.internal_links:
                    if link not in self.crawled_urls and link not in to_crawl:
                        to_crawl.append(link)

        logger.info(f"Crawled {len(self.crawled_urls)} pages")
        return self.results

    def get_summary(self) -> Dict:
        """Get crawl summary statistics."""
        total = len(self.results)
        successful = sum(1 for r in self.results.values() if r.status_code == 200)
        errors = sum(1 for r in self.results.values() if r.error)

        return {
            'total_pages': total,
            'successful': successful,
            'errors': errors,
            'error_rate': errors / total if total > 0 else 0,
            'avg_word_count': sum(r.word_count for r in self.results.values()) / successful if successful > 0 else 0,
            'avg_internal_links': sum(len(r.internal_links) for r in self.results.values()) / successful if successful > 0 else 0,
            'pages_with_schema': sum(1 for r in self.results.values() if r.schema_data),
            'crawl_timestamp': datetime.utcnow().isoformat()
        }
