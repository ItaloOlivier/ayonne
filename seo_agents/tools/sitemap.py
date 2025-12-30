"""
Sitemap Parser

Parses XML sitemaps to extract URLs for crawling.
"""

import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import urljoin
import xml.etree.ElementTree as ET

import requests

logger = logging.getLogger(__name__)

# Sitemap namespace
SITEMAP_NS = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}


@dataclass
class SitemapURL:
    """Represents a URL entry in a sitemap."""
    loc: str
    lastmod: Optional[datetime] = None
    changefreq: Optional[str] = None
    priority: Optional[float] = None


@dataclass
class SitemapIndex:
    """Represents a sitemap index file."""
    sitemaps: List[str]


class SitemapParser:
    """
    Parses XML sitemaps and sitemap index files.
    """

    def __init__(self, user_agent: str = "AyonneSEOBot/1.0"):
        self.user_agent = user_agent
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': user_agent})

    def fetch_sitemap(self, url: str) -> Optional[str]:
        """Fetch sitemap content from URL."""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            logger.error(f"Failed to fetch sitemap {url}: {e}")
            return None

    def parse(self, url: str) -> List[SitemapURL]:
        """
        Parse a sitemap URL and return all URLs.

        Handles both regular sitemaps and sitemap index files.
        """
        content = self.fetch_sitemap(url)
        if not content:
            return []

        try:
            root = ET.fromstring(content)
        except ET.ParseError as e:
            logger.error(f"Failed to parse sitemap XML: {e}")
            return []

        # Check if it's a sitemap index
        if root.tag.endswith('sitemapindex'):
            return self._parse_sitemap_index(root, url)
        elif root.tag.endswith('urlset'):
            return self._parse_urlset(root)
        else:
            logger.warning(f"Unknown sitemap format: {root.tag}")
            return []

    def _parse_sitemap_index(self, root: ET.Element, base_url: str) -> List[SitemapURL]:
        """Parse a sitemap index and fetch all child sitemaps."""
        all_urls = []

        for sitemap in root.findall('sm:sitemap', SITEMAP_NS):
            loc = sitemap.find('sm:loc', SITEMAP_NS)
            if loc is not None and loc.text:
                sitemap_url = loc.text.strip()
                logger.info(f"Found child sitemap: {sitemap_url}")
                child_urls = self.parse(sitemap_url)
                all_urls.extend(child_urls)

        return all_urls

    def _parse_urlset(self, root: ET.Element) -> List[SitemapURL]:
        """Parse a standard sitemap urlset."""
        urls = []

        for url_elem in root.findall('sm:url', SITEMAP_NS):
            url = self._parse_url_element(url_elem)
            if url:
                urls.append(url)

        logger.info(f"Parsed {len(urls)} URLs from sitemap")
        return urls

    def _parse_url_element(self, elem: ET.Element) -> Optional[SitemapURL]:
        """Parse a single URL element."""
        loc = elem.find('sm:loc', SITEMAP_NS)
        if loc is None or not loc.text:
            return None

        url = SitemapURL(loc=loc.text.strip())

        # Last modified
        lastmod = elem.find('sm:lastmod', SITEMAP_NS)
        if lastmod is not None and lastmod.text:
            url.lastmod = self._parse_date(lastmod.text.strip())

        # Change frequency
        changefreq = elem.find('sm:changefreq', SITEMAP_NS)
        if changefreq is not None and changefreq.text:
            url.changefreq = changefreq.text.strip()

        # Priority
        priority = elem.find('sm:priority', SITEMAP_NS)
        if priority is not None and priority.text:
            try:
                url.priority = float(priority.text.strip())
            except ValueError:
                pass

        return url

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse ISO date string."""
        formats = [
            '%Y-%m-%dT%H:%M:%S%z',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%d',
        ]
        for fmt in formats:
            try:
                # Handle timezone offset format
                if '+' in date_str and date_str.count(':') > 2:
                    # Remove colon from timezone (e.g., +00:00 -> +0000)
                    parts = date_str.rsplit(':', 1)
                    if len(parts) == 2 and len(parts[1]) == 2:
                        date_str = parts[0] + parts[1]
                return datetime.strptime(date_str[:19], fmt[:fmt.find('%z') if '%z' in fmt else len(fmt)])
            except ValueError:
                continue
        return None

    def get_urls_by_priority(self, urls: List[SitemapURL], min_priority: float = 0.5) -> List[str]:
        """Filter URLs by minimum priority."""
        return [u.loc for u in urls if u.priority is None or u.priority >= min_priority]

    def get_recently_modified(self, urls: List[SitemapURL], days: int = 30) -> List[str]:
        """Get URLs modified within the last N days."""
        cutoff = datetime.now().replace(tzinfo=None)
        from datetime import timedelta
        cutoff = cutoff - timedelta(days=days)

        return [
            u.loc for u in urls
            if u.lastmod and u.lastmod.replace(tzinfo=None) >= cutoff
        ]


def discover_sitemaps(base_url: str) -> List[str]:
    """
    Discover sitemaps for a domain.

    Checks robots.txt and common locations.
    """
    sitemaps = []
    base_url = base_url.rstrip('/')

    # Check robots.txt first
    try:
        response = requests.get(f"{base_url}/robots.txt", timeout=10)
        if response.status_code == 200:
            for line in response.text.split('\n'):
                line = line.strip().lower()
                if line.startswith('sitemap:'):
                    sitemap_url = line.split(':', 1)[1].strip()
                    # Handle relative URLs
                    if not sitemap_url.startswith('http'):
                        sitemap_url = urljoin(base_url, sitemap_url)
                    sitemaps.append(sitemap_url)
    except requests.RequestException:
        pass

    # Check common locations
    common_locations = [
        '/sitemap.xml',
        '/sitemap_index.xml',
        '/sitemap-index.xml',
        '/sitemaps/sitemap.xml',
    ]

    for path in common_locations:
        url = f"{base_url}{path}"
        if url not in sitemaps:
            try:
                response = requests.head(url, timeout=10)
                if response.status_code == 200:
                    sitemaps.append(url)
            except requests.RequestException:
                pass

    return sitemaps


def extract_url_patterns(urls: List[str]) -> Dict[str, List[str]]:
    """
    Group URLs by pattern (e.g., /products/, /collections/).

    Returns dictionary mapping patterns to URLs.
    """
    from urllib.parse import urlparse
    import re

    patterns: Dict[str, List[str]] = {}

    for url in urls:
        parsed = urlparse(url)
        path = parsed.path

        # Extract first path segment
        segments = [s for s in path.split('/') if s]
        if segments:
            pattern = f"/{segments[0]}/"
        else:
            pattern = "/"

        if pattern not in patterns:
            patterns[pattern] = []
        patterns[pattern].append(url)

    return patterns
