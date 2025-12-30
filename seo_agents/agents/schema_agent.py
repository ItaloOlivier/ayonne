"""
Schema Agent

Audits and generates JSON-LD structured data.
"""

import json
import time
import logging
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse

from .base import BaseAgent, AgentResult, Task, TaskPriority, TaskRisk


class SchemaAgent(BaseAgent):
    """
    Manages structured data (JSON-LD).

    Responsibilities:
    - Audit existing structured data
    - Generate missing schema
    - Validate JSON-LD syntax
    - Ensure schema matches page content
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        super().__init__(config, logger)
        self.pages_audited = 0
        self.schemas_found = 0
        self.schemas_missing = 0

    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """
        Analyze structured data across the site.

        Args:
            crawl_data: Dictionary of crawled page data

        Returns:
            AgentResult with schema audit and recommendations
        """
        start_time = time.time()
        result = AgentResult(agent_name=self.name, success=True)
        tasks = []

        self.log_info(f"Auditing schema on {len(crawl_data)} pages")

        try:
            for url, page in crawl_data.items():
                if page.status_code != 200:
                    continue

                self.pages_audited += 1
                page_tasks = self._audit_page_schema(url, page)
                tasks.extend(page_tasks)

            # Global schema checks
            global_tasks = self._check_global_schema(crawl_data)
            tasks.extend(global_tasks)

            result.tasks = tasks
            result.metrics = {
                'pages_audited': self.pages_audited,
                'pages_with_schema': self.schemas_found,
                'pages_missing_schema': self.schemas_missing,
                'schema_coverage': self.schemas_found / self.pages_audited if self.pages_audited > 0 else 0
            }

            result.summary = (
                f"Audited {self.pages_audited} pages. "
                f"{self.schemas_found} have schema ({result.metrics['schema_coverage']:.0%} coverage). "
                f"Generated {len(tasks)} schema recommendations."
            )

        except Exception as e:
            result.success = False
            result.errors.append(f"Schema audit failed: {str(e)}")
            self.log_error(f"Schema audit failed: {e}")

        result.execution_time = time.time() - start_time
        return result

    def _audit_page_schema(self, url: str, page: Any) -> List[Task]:
        """Audit schema for a single page."""
        tasks = []
        schema_data = getattr(page, 'schema_data', []) or []

        if not schema_data:
            self.schemas_missing += 1
        else:
            self.schemas_found += 1

        # Determine page type and required schema
        page_type = self._detect_page_type(url, page)
        required_schemas = self._get_required_schemas(page_type)

        # Check for existing schema types
        existing_types = self._extract_schema_types(schema_data)

        # Generate tasks for missing schema
        for schema_type in required_schemas:
            if schema_type not in existing_types:
                schema_json = self._generate_schema(schema_type, url, page)
                if schema_json:
                    tasks.append(self.create_task(
                        description=f"Add {schema_type} schema to {url}",
                        priority=TaskPriority.MEDIUM.value,
                        risk=TaskRisk.LOW.value,
                        action_type="modify",
                        target_url=url,
                        changes={
                            'add_schema': schema_type,
                            'json_ld': schema_json
                        },
                        metadata={'schema_type': schema_type}
                    ))

        # Validate existing schema
        for schema in schema_data:
            validation_tasks = self._validate_schema(schema, url)
            tasks.extend(validation_tasks)

        return tasks

    def _detect_page_type(self, url: str, page: Any) -> str:
        """Detect the type of page based on URL and content."""
        parsed = urlparse(url)
        path = parsed.path.lower()

        if '/products/' in path or '/product/' in path:
            return 'product'
        elif '/collections/' in path or '/category/' in path:
            return 'collection'
        elif '/pages/about' in path:
            return 'about'
        elif '/pages/faq' in path or '/faq' in path:
            return 'faq'
        elif '/blog/' in path or '/articles/' in path:
            return 'article'
        elif path in ('/', ''):
            return 'homepage'
        elif '/skin-analysis' in path:
            return 'tool'
        else:
            return 'page'

    def _get_required_schemas(self, page_type: str) -> List[str]:
        """Get required schema types for page type."""
        schemas = {
            'product': ['Product', 'BreadcrumbList'],
            'collection': ['CollectionPage', 'BreadcrumbList'],
            'about': ['Organization', 'BreadcrumbList'],
            'faq': ['FAQPage', 'BreadcrumbList'],
            'article': ['Article', 'BreadcrumbList'],
            'homepage': ['WebSite', 'Organization'],
            'tool': ['WebApplication', 'BreadcrumbList'],
            'page': ['BreadcrumbList']
        }
        return schemas.get(page_type, ['BreadcrumbList'])

    def _extract_schema_types(self, schema_data: List[Dict]) -> set:
        """Extract all schema types from schema data."""
        types = set()
        for schema in schema_data:
            if '@graph' in schema:
                for item in schema['@graph']:
                    if '@type' in item:
                        types.add(item['@type'])
            elif '@type' in schema:
                schema_type = schema['@type']
                if isinstance(schema_type, list):
                    types.update(schema_type)
                else:
                    types.add(schema_type)
        return types

    def _generate_schema(self, schema_type: str, url: str, page: Any) -> Optional[str]:
        """Generate JSON-LD schema for a page."""
        title = getattr(page, 'title', '') or ''
        description = getattr(page, 'description', '') or ''

        generators = {
            'BreadcrumbList': self._generate_breadcrumb,
            'FAQPage': self._generate_faq,
            'Organization': self._generate_organization,
            'WebSite': self._generate_website,
            'Product': self._generate_product_placeholder,
            'Article': self._generate_article,
            'WebApplication': self._generate_web_application,
        }

        generator = generators.get(schema_type)
        if generator:
            schema = generator(url, title, description)
            return json.dumps(schema, indent=2)
        return None

    def _generate_breadcrumb(self, url: str, title: str, description: str) -> Dict:
        """Generate BreadcrumbList schema."""
        parsed = urlparse(url)
        path_parts = [p for p in parsed.path.split('/') if p]
        base_url = f"{parsed.scheme}://{parsed.netloc}"

        items = [{"@type": "ListItem", "position": 1, "name": "Home", "item": base_url}]

        current_path = ""
        for i, part in enumerate(path_parts, 2):
            current_path += f"/{part}"
            name = part.replace('-', ' ').title()
            items.append({
                "@type": "ListItem",
                "position": i,
                "name": name,
                "item": f"{base_url}{current_path}"
            })

        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items
        }

    def _generate_faq(self, url: str, title: str, description: str) -> Dict:
        """Generate FAQPage schema template."""
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "What is AI Skin Analysis?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "AI Skin Analysis uses advanced computer vision to analyze your skin type and conditions from a selfie, providing personalized skincare recommendations."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Is the skin analysis free?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes, the AI skin analysis is completely free. You can analyze your skin and get personalized product recommendations at no cost."
                    }
                }
            ]
        }

    def _generate_organization(self, url: str, title: str, description: str) -> Dict:
        """Generate Organization schema."""
        return {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Ayonne Skincare",
            "url": "https://ayonne.skin",
            "logo": "https://ayonne.skin/logo.png",
            "description": "Premium vegan skincare backed by science. 100% cruelty-free, paraben-free products made in North America.",
            "sameAs": []
        }

    def _generate_website(self, url: str, title: str, description: str) -> Dict:
        """Generate WebSite schema."""
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Ayonne Skincare",
            "url": "https://ayonne.skin",
            "potentialAction": {
                "@type": "SearchAction",
                "target": "https://ayonne.skin/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        }

    def _generate_product_placeholder(self, url: str, title: str, description: str) -> Dict:
        """Generate Product schema placeholder."""
        return {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": title or "Product Name",
            "description": description or "Product description",
            "brand": {"@type": "Brand", "name": "Ayonne"},
            "offers": {
                "@type": "Offer",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
            }
        }

    def _generate_article(self, url: str, title: str, description: str) -> Dict:
        """Generate Article schema."""
        return {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "author": {"@type": "Organization", "name": "Ayonne Skincare"},
            "publisher": {
                "@type": "Organization",
                "name": "Ayonne Skincare",
                "logo": {"@type": "ImageObject", "url": "https://ayonne.skin/logo.png"}
            }
        }

    def _generate_web_application(self, url: str, title: str, description: str) -> Dict:
        """Generate WebApplication schema for AI analyzer."""
        return {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Ayonne AI Skin Analyzer",
            "url": url,
            "applicationCategory": "HealthApplication",
            "operatingSystem": "Any",
            "description": "Free AI-powered skin analysis tool that provides personalized skincare recommendations.",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            }
        }

    def _validate_schema(self, schema: Dict, url: str) -> List[Task]:
        """Validate schema and return tasks for issues."""
        tasks = []

        try:
            # Check for required fields based on type
            schema_type = schema.get('@type', '')

            if schema_type == 'Product':
                if 'name' not in schema:
                    tasks.append(self.create_task(
                        description=f"Product schema missing 'name' on {url}",
                        priority=TaskPriority.MEDIUM.value,
                        risk=TaskRisk.LOW.value,
                        action_type="modify",
                        target_url=url
                    ))

            elif schema_type == 'FAQPage':
                if 'mainEntity' not in schema or not schema['mainEntity']:
                    tasks.append(self.create_task(
                        description=f"FAQPage schema has no questions on {url}",
                        priority=TaskPriority.MEDIUM.value,
                        risk=TaskRisk.LOW.value,
                        action_type="modify",
                        target_url=url
                    ))

        except Exception as e:
            self.log_warning(f"Schema validation error: {e}")

        return tasks

    def _check_global_schema(self, crawl_data: Dict) -> List[Task]:
        """Check for site-wide schema requirements."""
        tasks = []

        # Check homepage for Organization and WebSite
        for url in crawl_data:
            parsed = urlparse(url)
            if parsed.path in ('', '/'):
                page = crawl_data[url]
                schema_types = self._extract_schema_types(getattr(page, 'schema_data', []) or [])

                if 'Organization' not in schema_types:
                    tasks.append(self.create_task(
                        description="Add Organization schema to homepage",
                        priority=TaskPriority.HIGH.value,
                        risk=TaskRisk.LOW.value,
                        action_type="modify",
                        target_url=url,
                        changes={'add_schema': 'Organization'}
                    ))

                if 'WebSite' not in schema_types:
                    tasks.append(self.create_task(
                        description="Add WebSite schema to homepage",
                        priority=TaskPriority.HIGH.value,
                        risk=TaskRisk.LOW.value,
                        action_type="modify",
                        target_url=url,
                        changes={'add_schema': 'WebSite'}
                    ))
                break

        return tasks

    def get_kpis(self) -> Dict:
        """Return agent KPIs."""
        return {
            'pages_audited': self.pages_audited,
            'schema_coverage': self.schemas_found / self.pages_audited if self.pages_audited > 0 else 0,
            'pages_with_schema': self.schemas_found
        }
