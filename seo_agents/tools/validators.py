"""
Validators

Quality gate validators for SEO changes.
"""

import json
import re
import logging
from typing import Dict, List, Optional, Tuple, Set
from urllib.parse import urlparse, urljoin
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Result of a validation check."""
    passed: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    details: Dict = field(default_factory=dict)


def validate_json_ld(json_ld: str) -> ValidationResult:
    """
    Validate JSON-LD structured data.

    Checks:
    - Valid JSON syntax
    - Has @context
    - Has @type
    - URLs are properly formatted
    """
    result = ValidationResult(passed=True)

    # Parse JSON
    try:
        data = json.loads(json_ld)
    except json.JSONDecodeError as e:
        result.passed = False
        result.errors.append(f"Invalid JSON syntax: {str(e)}")
        return result

    # Handle array of schemas
    if isinstance(data, list):
        for i, item in enumerate(data):
            item_result = _validate_schema_object(item, f"[{i}]")
            result.errors.extend(item_result.errors)
            result.warnings.extend(item_result.warnings)
    else:
        item_result = _validate_schema_object(data, "")
        result.errors.extend(item_result.errors)
        result.warnings.extend(item_result.warnings)

    result.passed = len(result.errors) == 0
    return result


def _validate_schema_object(data: dict, prefix: str) -> ValidationResult:
    """Validate a single schema object."""
    result = ValidationResult(passed=True)

    if not isinstance(data, dict):
        result.errors.append(f"{prefix}: Expected object, got {type(data).__name__}")
        return result

    # Handle @graph
    if '@graph' in data:
        for i, item in enumerate(data['@graph']):
            item_result = _validate_schema_object(item, f"{prefix}@graph[{i}]")
            result.errors.extend(item_result.errors)
            result.warnings.extend(item_result.warnings)
        return result

    # Check @context
    if '@context' not in data and prefix == "":
        result.warnings.append(f"{prefix}: Missing @context")

    # Check @type
    if '@type' not in data:
        result.errors.append(f"{prefix}: Missing @type")
    else:
        schema_type = data['@type']
        _validate_schema_type(schema_type, data, prefix, result)

    # Validate URLs
    url_fields = ['url', '@id', 'image', 'logo', 'mainEntityOfPage']
    for field in url_fields:
        if field in data:
            value = data[field]
            if isinstance(value, str) and not _is_valid_url(value):
                if not value.startswith('#'):  # Allow anchors
                    result.warnings.append(f"{prefix}.{field}: Invalid URL format: {value[:50]}")

    return result


def _validate_schema_type(schema_type: str, data: dict, prefix: str, result: ValidationResult) -> None:
    """Validate schema-specific required fields."""
    required_fields = {
        'Product': ['name'],
        'FAQPage': ['mainEntity'],
        'Question': ['name', 'acceptedAnswer'],
        'Answer': ['text'],
        'BreadcrumbList': ['itemListElement'],
        'Organization': ['name'],
        'WebSite': ['name', 'url'],
        'Article': ['headline', 'author'],
        'HowTo': ['name', 'step'],
    }

    if schema_type in required_fields:
        for field in required_fields[schema_type]:
            if field not in data:
                result.errors.append(f"{prefix}: {schema_type} missing required field '{field}'")


def _is_valid_url(url: str) -> bool:
    """Check if string is a valid URL."""
    try:
        parsed = urlparse(url)
        return parsed.scheme in ('http', 'https') and bool(parsed.netloc)
    except Exception:
        return False


def validate_meta_tags(
    title: str,
    description: str,
    canonical: str,
    robots: str,
    url: str
) -> ValidationResult:
    """
    Validate meta tags for SEO best practices.
    """
    result = ValidationResult(passed=True)

    # Title validation
    if not title:
        result.errors.append("Missing title tag")
    elif len(title) < 30:
        result.warnings.append(f"Title too short ({len(title)} chars, recommended: 30-60)")
    elif len(title) > 60:
        result.warnings.append(f"Title too long ({len(title)} chars, recommended: 30-60)")

    # Description validation
    if not description:
        result.errors.append("Missing meta description")
    elif len(description) < 120:
        result.warnings.append(f"Meta description too short ({len(description)} chars)")
    elif len(description) > 160:
        result.warnings.append(f"Meta description too long ({len(description)} chars)")

    # Canonical validation
    if canonical:
        if not _is_valid_url(canonical):
            result.errors.append(f"Invalid canonical URL: {canonical}")
        else:
            # Check if canonical points to different domain
            canonical_domain = urlparse(canonical).netloc
            page_domain = urlparse(url).netloc
            if canonical_domain != page_domain:
                result.warnings.append(f"Canonical points to different domain: {canonical_domain}")

    # Robots validation
    if robots:
        robots_lower = robots.lower()
        if 'noindex' in robots_lower:
            result.warnings.append("Page has noindex directive")
        if 'nofollow' in robots_lower:
            result.warnings.append("Page has nofollow directive")

    result.passed = len(result.errors) == 0
    return result


def check_forbidden_words(
    content: str,
    forbidden_words: List[str],
    allowed_disclaimers: Optional[List[str]] = None
) -> ValidationResult:
    """
    Check content for forbidden words/phrases.

    Args:
        content: Text content to check
        forbidden_words: List of forbidden words/phrases
        allowed_disclaimers: Phrases that allow otherwise forbidden content
    """
    result = ValidationResult(passed=True)
    content_lower = content.lower()

    # Check for allowed disclaimers first
    has_disclaimer = False
    if allowed_disclaimers:
        for disclaimer in allowed_disclaimers:
            if disclaimer.lower() in content_lower:
                has_disclaimer = True
                result.details['has_disclaimer'] = True
                break

    # Check for forbidden words
    found_forbidden = []
    for word in forbidden_words:
        word_lower = word.lower()
        # Use word boundary matching
        pattern = r'\b' + re.escape(word_lower) + r'\b'
        matches = re.findall(pattern, content_lower)
        if matches:
            found_forbidden.append({
                'word': word,
                'count': len(matches)
            })

    if found_forbidden:
        result.details['forbidden_words_found'] = found_forbidden

        # Some words are only errors without disclaimer
        critical_words = ['cure', 'treat', 'heal', 'diagnose', 'disease', 'prescription']
        has_critical = any(
            item['word'].lower() in critical_words
            for item in found_forbidden
        )

        if has_critical and not has_disclaimer:
            result.passed = False
            for item in found_forbidden:
                if item['word'].lower() in critical_words:
                    result.errors.append(
                        f"Forbidden word '{item['word']}' found {item['count']} time(s) "
                        "without required disclaimer"
                    )
        else:
            for item in found_forbidden:
                result.warnings.append(
                    f"Potentially problematic word '{item['word']}' found {item['count']} time(s)"
                )

    return result


def validate_internal_links(
    page_links: Dict[str, List[str]],
    valid_urls: Set[str]
) -> ValidationResult:
    """
    Validate internal links don't create broken links.

    Args:
        page_links: Dict mapping page URLs to their internal links
        valid_urls: Set of known valid URLs on the site
    """
    result = ValidationResult(passed=True)
    broken_links = []
    orphan_pages = set(valid_urls)

    for page_url, links in page_links.items():
        for link in links:
            # Normalize URL
            parsed = urlparse(link)
            normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip('/')

            if normalized in valid_urls:
                orphan_pages.discard(normalized)
            elif not _is_external_link(link, page_url):
                broken_links.append({
                    'source': page_url,
                    'broken_link': link
                })

    if broken_links:
        result.passed = False
        for item in broken_links[:10]:  # Limit to first 10
            result.errors.append(
                f"Broken internal link: {item['broken_link']} on page {item['source']}"
            )
        if len(broken_links) > 10:
            result.errors.append(f"...and {len(broken_links) - 10} more broken links")

    # Report orphan pages (no internal links pointing to them)
    if orphan_pages:
        for orphan in list(orphan_pages)[:5]:
            result.warnings.append(f"Orphan page (no internal links): {orphan}")
        if len(orphan_pages) > 5:
            result.warnings.append(f"...and {len(orphan_pages) - 5} more orphan pages")

    result.details['broken_links_count'] = len(broken_links)
    result.details['orphan_pages_count'] = len(orphan_pages)

    return result


def _is_external_link(link: str, page_url: str) -> bool:
    """Check if link is external."""
    page_domain = urlparse(page_url).netloc
    link_domain = urlparse(link).netloc

    return bool(link_domain) and link_domain != page_domain


def validate_changes_limit(
    files_to_modify: List[str],
    max_changes: int = 5
) -> ValidationResult:
    """
    Validate that changes don't exceed the daily limit.
    """
    result = ValidationResult(passed=True)

    if len(files_to_modify) > max_changes:
        result.passed = False
        result.errors.append(
            f"Too many changes ({len(files_to_modify)}) exceeds limit ({max_changes}). "
            "Requires manual review mode."
        )
        result.details['files_count'] = len(files_to_modify)
        result.details['limit'] = max_changes

    return result


def validate_noindex_not_added(
    before_content: str,
    after_content: str
) -> ValidationResult:
    """
    Ensure changes don't accidentally add noindex.
    """
    result = ValidationResult(passed=True)

    # Check for noindex in meta robots
    noindex_pattern = r'<meta[^>]*name=["\']robots["\'][^>]*content=["\'][^"\']*noindex'
    noindex_pattern_alt = r'<meta[^>]*content=["\'][^"\']*noindex[^"\']*["\'][^>]*name=["\']robots'

    had_noindex = bool(
        re.search(noindex_pattern, before_content, re.IGNORECASE) or
        re.search(noindex_pattern_alt, before_content, re.IGNORECASE)
    )

    has_noindex = bool(
        re.search(noindex_pattern, after_content, re.IGNORECASE) or
        re.search(noindex_pattern_alt, after_content, re.IGNORECASE)
    )

    if has_noindex and not had_noindex:
        result.passed = False
        result.errors.append("Change would add noindex to previously indexed page")

    return result


def run_all_validators(
    content: str,
    json_ld: Optional[str] = None,
    meta_title: str = "",
    meta_description: str = "",
    canonical: str = "",
    robots: str = "",
    url: str = "",
    forbidden_words: Optional[List[str]] = None,
    allowed_disclaimers: Optional[List[str]] = None
) -> ValidationResult:
    """
    Run all validators and aggregate results.
    """
    result = ValidationResult(passed=True)

    # Forbidden words check
    if forbidden_words:
        forbidden_result = check_forbidden_words(content, forbidden_words, allowed_disclaimers)
        result.errors.extend(forbidden_result.errors)
        result.warnings.extend(forbidden_result.warnings)

    # Meta tags check
    if meta_title or meta_description:
        meta_result = validate_meta_tags(meta_title, meta_description, canonical, robots, url)
        result.errors.extend(meta_result.errors)
        result.warnings.extend(meta_result.warnings)

    # JSON-LD check
    if json_ld:
        jsonld_result = validate_json_ld(json_ld)
        result.errors.extend(jsonld_result.errors)
        result.warnings.extend(jsonld_result.warnings)

    result.passed = len(result.errors) == 0
    return result
