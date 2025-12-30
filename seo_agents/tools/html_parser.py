"""
HTML Parser

Extracts SEO-relevant data from HTML documents.
"""

import re
import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
import textstat

logger = logging.getLogger(__name__)


@dataclass
class SEOData:
    """SEO-relevant data extracted from a page."""
    url: str
    title: str = ""
    title_length: int = 0
    meta_description: str = ""
    meta_description_length: int = 0
    h1: str = ""
    h1_count: int = 0
    h2_list: List[str] = field(default_factory=list)
    canonical: str = ""
    robots: str = ""
    og_title: str = ""
    og_description: str = ""
    og_image: str = ""
    twitter_card: str = ""
    hreflang_tags: List[Dict] = field(default_factory=list)
    word_count: int = 0
    readability_score: float = 0.0
    internal_links: int = 0
    external_links: int = 0
    images_without_alt: int = 0
    images_total: int = 0
    schema_types: List[str] = field(default_factory=list)
    has_faq_schema: bool = False
    has_product_schema: bool = False
    has_breadcrumb_schema: bool = False
    has_howto_schema: bool = False
    issues: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)


class HTMLParser:
    """
    Parses HTML and extracts SEO-relevant data.
    """

    def __init__(self, base_url: str):
        self.base_url = base_url

    def parse(self, html: str, url: str) -> SEOData:
        """Parse HTML and extract SEO data."""
        soup = BeautifulSoup(html, 'lxml')
        data = SEOData(url=url)

        self._extract_title(soup, data)
        self._extract_meta(soup, data)
        self._extract_headings(soup, data)
        self._extract_canonical(soup, data)
        self._extract_og_tags(soup, data)
        self._extract_links(soup, data, url)
        self._extract_images(soup, data)
        self._extract_schema(soup, data)
        self._extract_content_metrics(soup, data)
        self._analyze_issues(data)

        return data

    def _extract_title(self, soup: BeautifulSoup, data: SEOData) -> None:
        """Extract page title."""
        title_tag = soup.find('title')
        if title_tag:
            data.title = title_tag.get_text(strip=True)
            data.title_length = len(data.title)

    def _extract_meta(self, soup: BeautifulSoup, data: SEOData) -> None:
        """Extract meta tags."""
        # Description
        desc = soup.find('meta', attrs={'name': 'description'})
        if desc:
            data.meta_description = desc.get('content', '')
            data.meta_description_length = len(data.meta_description)

        # Robots
        robots = soup.find('meta', attrs={'name': 'robots'})
        if robots:
            data.robots = robots.get('content', '')

    def _extract_headings(self, soup: BeautifulSoup, data: SEOData) -> None:
        """Extract heading structure."""
        h1_tags = soup.find_all('h1')
        data.h1_count = len(h1_tags)
        if h1_tags:
            data.h1 = h1_tags[0].get_text(strip=True)

        h2_tags = soup.find_all('h2')
        data.h2_list = [h2.get_text(strip=True) for h2 in h2_tags[:10]]  # Limit to 10

    def _extract_canonical(self, soup: BeautifulSoup, data: SEOData) -> None:
        """Extract canonical URL."""
        canonical = soup.find('link', attrs={'rel': 'canonical'})
        if canonical:
            data.canonical = canonical.get('href', '')

    def _extract_og_tags(self, soup: BeautifulSoup, data: SEOData) -> None:
        """Extract Open Graph and Twitter tags."""
        og_title = soup.find('meta', attrs={'property': 'og:title'})
        if og_title:
            data.og_title = og_title.get('content', '')

        og_desc = soup.find('meta', attrs={'property': 'og:description'})
        if og_desc:
            data.og_description = og_desc.get('content', '')

        og_image = soup.find('meta', attrs={'property': 'og:image'})
        if og_image:
            data.og_image = og_image.get('content', '')

        twitter = soup.find('meta', attrs={'name': 'twitter:card'})
        if twitter:
            data.twitter_card = twitter.get('content', '')

        # Hreflang
        for link in soup.find_all('link', attrs={'rel': 'alternate', 'hreflang': True}):
            data.hreflang_tags.append({
                'lang': link.get('hreflang'),
                'href': link.get('href')
            })

    def _extract_links(self, soup: BeautifulSoup, data: SEOData, current_url: str) -> None:
        """Count internal and external links."""
        base_domain = urlparse(self.base_url).netloc
        internal = 0
        external = 0

        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            if not href or href.startswith('#'):
                continue

            full_url = urljoin(current_url, href)
            parsed = urlparse(full_url)

            if parsed.netloc == base_domain or not parsed.netloc:
                internal += 1
            else:
                external += 1

        data.internal_links = internal
        data.external_links = external

    def _extract_images(self, soup: BeautifulSoup, data: SEOData) -> None:
        """Analyze images."""
        images = soup.find_all('img')
        data.images_total = len(images)
        data.images_without_alt = sum(1 for img in images if not img.get('alt', '').strip())

    def _extract_schema(self, soup: BeautifulSoup, data: SEOData) -> None:
        """Extract and analyze structured data."""
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                schema_data = json.loads(script.string)
                self._process_schema(schema_data, data)
            except (json.JSONDecodeError, TypeError):
                continue

    def _process_schema(self, schema_data: dict, data: SEOData) -> None:
        """Process schema data recursively."""
        if isinstance(schema_data, list):
            for item in schema_data:
                self._process_schema(item, data)
            return

        if not isinstance(schema_data, dict):
            return

        # Handle @graph
        if '@graph' in schema_data:
            for item in schema_data['@graph']:
                self._process_schema(item, data)
            return

        schema_type = schema_data.get('@type', '')
        if isinstance(schema_type, list):
            schema_type = schema_type[0] if schema_type else ''

        if schema_type:
            data.schema_types.append(schema_type)

            if schema_type == 'FAQPage':
                data.has_faq_schema = True
            elif schema_type == 'Product':
                data.has_product_schema = True
            elif schema_type == 'BreadcrumbList':
                data.has_breadcrumb_schema = True
            elif schema_type == 'HowTo':
                data.has_howto_schema = True

    def _extract_content_metrics(self, soup: BeautifulSoup, data: SEOData) -> None:
        """Calculate content metrics."""
        # Remove non-content elements
        for tag in soup.find_all(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            tag.decompose()

        # Get main content
        main = soup.find('main') or soup.find('article') or soup.body
        if main:
            text = main.get_text(separator=' ', strip=True)
            # Clean up whitespace
            text = re.sub(r'\s+', ' ', text)
            data.word_count = len(text.split())

            # Calculate readability (Flesch-Kincaid)
            if data.word_count > 100:
                try:
                    data.readability_score = textstat.flesch_reading_ease(text)
                except Exception:
                    data.readability_score = 0

    def _analyze_issues(self, data: SEOData) -> None:
        """Analyze SEO data and identify issues."""
        # Title issues
        if not data.title:
            data.issues.append("Missing title tag")
        elif data.title_length < 30:
            data.issues.append(f"Title too short ({data.title_length} chars, recommended: 30-60)")
        elif data.title_length > 60:
            data.issues.append(f"Title too long ({data.title_length} chars, recommended: 30-60)")

        # Meta description issues
        if not data.meta_description:
            data.issues.append("Missing meta description")
        elif data.meta_description_length < 120:
            data.issues.append(f"Meta description too short ({data.meta_description_length} chars)")
        elif data.meta_description_length > 160:
            data.issues.append(f"Meta description too long ({data.meta_description_length} chars)")

        # H1 issues
        if data.h1_count == 0:
            data.issues.append("Missing H1 tag")
        elif data.h1_count > 1:
            data.issues.append(f"Multiple H1 tags ({data.h1_count})")

        # Canonical issues
        if not data.canonical:
            data.suggestions.append("Consider adding canonical tag")

        # Content issues
        if data.word_count < 300:
            data.issues.append(f"Thin content ({data.word_count} words, recommended: 300+)")

        # Image issues
        if data.images_without_alt > 0:
            data.issues.append(f"{data.images_without_alt} images missing alt text")

        # Internal linking
        if data.internal_links < 3:
            data.suggestions.append(f"Low internal links ({data.internal_links}, recommended: 3+)")

        # Schema suggestions
        if not data.has_breadcrumb_schema:
            data.suggestions.append("Add BreadcrumbList schema")

        # Robots issues
        if 'noindex' in data.robots.lower():
            data.issues.append("Page is set to noindex")


def extract_faq_candidates(soup: BeautifulSoup) -> List[Tuple[str, str]]:
    """
    Extract potential FAQ content from HTML.

    Returns list of (question, answer) tuples.
    """
    faqs = []

    # Look for common FAQ patterns
    # Pattern 1: <details><summary>Q</summary>A</details>
    for details in soup.find_all('details'):
        summary = details.find('summary')
        if summary:
            question = summary.get_text(strip=True)
            answer = details.get_text(strip=True).replace(question, '', 1).strip()
            if question and answer:
                faqs.append((question, answer))

    # Pattern 2: Heading followed by paragraph
    for heading in soup.find_all(['h2', 'h3', 'h4']):
        text = heading.get_text(strip=True)
        if text.endswith('?'):
            next_p = heading.find_next_sibling('p')
            if next_p:
                answer = next_p.get_text(strip=True)
                if answer:
                    faqs.append((text, answer))

    # Pattern 3: dt/dd pairs
    for dt in soup.find_all('dt'):
        dd = dt.find_next_sibling('dd')
        if dd:
            question = dt.get_text(strip=True)
            answer = dd.get_text(strip=True)
            if question and answer:
                faqs.append((question, answer))

    return faqs


def extract_howto_candidates(soup: BeautifulSoup) -> List[Dict]:
    """
    Extract potential HowTo content from HTML.

    Returns list of step dictionaries.
    """
    steps = []

    # Look for ordered lists
    for ol in soup.find_all('ol'):
        for i, li in enumerate(ol.find_all('li', recursive=False), 1):
            text = li.get_text(strip=True)
            if text:
                steps.append({
                    'position': i,
                    'text': text
                })

    # Look for numbered headings (Step 1, Step 2, etc.)
    step_pattern = re.compile(r'step\s*(\d+)', re.IGNORECASE)
    for heading in soup.find_all(['h2', 'h3', 'h4']):
        text = heading.get_text(strip=True)
        match = step_pattern.search(text)
        if match:
            next_p = heading.find_next_sibling('p')
            if next_p:
                steps.append({
                    'position': int(match.group(1)),
                    'name': text,
                    'text': next_p.get_text(strip=True)
                })

    return steps
