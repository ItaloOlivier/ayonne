"""
Content Diffing

Utilities for comparing content and generating diffs.
"""

import difflib
import hashlib
import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class ContentChange:
    """Represents a change to content."""
    change_type: str  # 'added', 'removed', 'modified'
    location: str  # e.g., 'title', 'meta_description', 'h1', 'body'
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    line_number: Optional[int] = None


@dataclass
class DiffResult:
    """Result of content comparison."""
    url: str
    has_changes: bool
    content_hash_before: str
    content_hash_after: str
    changes: List[ContentChange] = field(default_factory=list)
    similarity_ratio: float = 1.0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class ContentDiffer:
    """
    Compares content versions and generates diffs.
    """

    def __init__(self):
        self.previous_content: Dict[str, str] = {}
        self.previous_hashes: Dict[str, str] = {}

    def compute_hash(self, content: str) -> str:
        """Compute MD5 hash of content."""
        return hashlib.md5(content.encode('utf-8')).hexdigest()

    def store_baseline(self, url: str, content: str) -> None:
        """Store content as baseline for future comparison."""
        self.previous_content[url] = content
        self.previous_hashes[url] = self.compute_hash(content)

    def compare(self, url: str, new_content: str) -> DiffResult:
        """
        Compare new content against stored baseline.

        Args:
            url: URL identifier
            new_content: New content to compare

        Returns:
            DiffResult with changes
        """
        new_hash = self.compute_hash(new_content)
        old_content = self.previous_content.get(url, '')
        old_hash = self.previous_hashes.get(url, '')

        result = DiffResult(
            url=url,
            has_changes=new_hash != old_hash,
            content_hash_before=old_hash,
            content_hash_after=new_hash
        )

        if not result.has_changes:
            result.similarity_ratio = 1.0
            return result

        # Calculate similarity
        matcher = difflib.SequenceMatcher(None, old_content, new_content)
        result.similarity_ratio = matcher.ratio()

        # Generate detailed diff
        result.changes = self._find_changes(old_content, new_content)

        return result

    def _find_changes(self, old: str, new: str) -> List[ContentChange]:
        """Find specific changes between old and new content."""
        changes = []

        old_lines = old.splitlines()
        new_lines = new.splitlines()

        differ = difflib.Differ()
        diff = list(differ.compare(old_lines, new_lines))

        line_num = 0
        for line in diff:
            if line.startswith('  '):  # Unchanged
                line_num += 1
            elif line.startswith('- '):  # Removed
                changes.append(ContentChange(
                    change_type='removed',
                    location='body',
                    old_value=line[2:],
                    line_number=line_num
                ))
                line_num += 1
            elif line.startswith('+ '):  # Added
                changes.append(ContentChange(
                    change_type='added',
                    location='body',
                    new_value=line[2:],
                    line_number=line_num
                ))

        return changes

    def compare_seo_elements(
        self,
        old_data: Dict,
        new_data: Dict
    ) -> List[ContentChange]:
        """
        Compare specific SEO elements.

        Args:
            old_data: Dict with title, description, h1, etc.
            new_data: Dict with same structure

        Returns:
            List of changes
        """
        changes = []
        elements = ['title', 'meta_description', 'h1', 'canonical', 'robots']

        for element in elements:
            old_value = old_data.get(element, '')
            new_value = new_data.get(element, '')

            if old_value != new_value:
                if not old_value and new_value:
                    change_type = 'added'
                elif old_value and not new_value:
                    change_type = 'removed'
                else:
                    change_type = 'modified'

                changes.append(ContentChange(
                    change_type=change_type,
                    location=element,
                    old_value=old_value or None,
                    new_value=new_value or None
                ))

        return changes

    def generate_unified_diff(
        self,
        old_content: str,
        new_content: str,
        filename: str = 'content'
    ) -> str:
        """Generate unified diff format."""
        old_lines = old_content.splitlines(keepends=True)
        new_lines = new_content.splitlines(keepends=True)

        diff = difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile=f'a/{filename}',
            tofile=f'b/{filename}'
        )

        return ''.join(diff)

    def generate_html_diff(
        self,
        old_content: str,
        new_content: str,
        context_lines: int = 3
    ) -> str:
        """Generate HTML diff for visualization."""
        old_lines = old_content.splitlines()
        new_lines = new_content.splitlines()

        differ = difflib.HtmlDiff()
        return differ.make_table(
            old_lines,
            new_lines,
            fromdesc='Before',
            todesc='After',
            context=True,
            numlines=context_lines
        )


def compare_schema(old_schema: List[Dict], new_schema: List[Dict]) -> Dict:
    """
    Compare JSON-LD schemas.

    Returns summary of schema changes.
    """
    def extract_types(schemas: List[Dict]) -> Dict[str, Dict]:
        """Extract schema types and their data."""
        types = {}
        for schema in schemas:
            if '@graph' in schema:
                for item in schema['@graph']:
                    schema_type = item.get('@type', 'Unknown')
                    types[schema_type] = item
            else:
                schema_type = schema.get('@type', 'Unknown')
                types[schema_type] = schema
        return types

    old_types = extract_types(old_schema)
    new_types = extract_types(new_schema)

    added = [t for t in new_types if t not in old_types]
    removed = [t for t in old_types if t not in new_types]
    modified = []

    for schema_type in set(old_types.keys()) & set(new_types.keys()):
        if json.dumps(old_types[schema_type], sort_keys=True) != \
           json.dumps(new_types[schema_type], sort_keys=True):
            modified.append(schema_type)

    return {
        'added': added,
        'removed': removed,
        'modified': modified,
        'unchanged': [
            t for t in old_types
            if t in new_types and t not in modified
        ]
    }


def detect_content_changes(
    baseline: Dict[str, Dict],
    current: Dict[str, Dict]
) -> Dict[str, DiffResult]:
    """
    Detect changes across multiple pages.

    Args:
        baseline: Dict mapping URL to content data
        current: Dict mapping URL to content data

    Returns:
        Dict mapping URL to DiffResult
    """
    differ = ContentDiffer()
    results = {}

    # Check existing pages
    for url in baseline:
        if url in current:
            old_content = json.dumps(baseline[url], sort_keys=True)
            new_content = json.dumps(current[url], sort_keys=True)
            differ.store_baseline(url, old_content)
            results[url] = differ.compare(url, new_content)
        else:
            # Page removed
            results[url] = DiffResult(
                url=url,
                has_changes=True,
                content_hash_before=differ.compute_hash(json.dumps(baseline[url])),
                content_hash_after='',
                changes=[ContentChange(
                    change_type='removed',
                    location='page',
                    old_value=url
                )]
            )

    # Check new pages
    for url in current:
        if url not in baseline:
            results[url] = DiffResult(
                url=url,
                has_changes=True,
                content_hash_before='',
                content_hash_after=differ.compute_hash(json.dumps(current[url])),
                changes=[ContentChange(
                    change_type='added',
                    location='page',
                    new_value=url
                )]
            )

    return results


def generate_change_summary(results: Dict[str, DiffResult]) -> Dict:
    """Generate summary of all changes."""
    changed_pages = [url for url, r in results.items() if r.has_changes]
    unchanged_pages = [url for url, r in results.items() if not r.has_changes]

    total_changes = sum(len(r.changes) for r in results.values())

    return {
        'total_pages': len(results),
        'changed_pages': len(changed_pages),
        'unchanged_pages': len(unchanged_pages),
        'total_changes': total_changes,
        'changed_urls': changed_pages,
        'avg_similarity': sum(r.similarity_ratio for r in results.values()) / len(results) if results else 1.0
    }
