"""
Google Merchant Center Agent for the SEO Multi-Agent System.

Monitors product feed health, identifies disapproved products,
and generates fix recommendations.
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

from .base import BaseAgent, Task, AgentResult, Priority, Risk

logger = logging.getLogger(__name__)


class GoogleMerchantCenterAgent(BaseAgent):
    """
    Agent that monitors Google Merchant Center product feed.

    Responsibilities:
    - Monitor product disapprovals and issues
    - Identify common problems (missing GTIN, brand, images)
    - Generate fix recommendations
    - Track feed health over time
    - Prioritize critical issues affecting visibility
    """

    name = "gmc"
    description = "Google Merchant Center product feed monitoring"

    # Issue severity mapping to task priority
    SEVERITY_PRIORITY = {
        'critical': Priority.CRITICAL,
        'error': Priority.HIGH,
        'warning': Priority.MEDIUM,
        'suggestion': Priority.LOW
    }

    # Common GMC issues and their fix categories
    ISSUE_CATEGORIES = {
        'gtin': ['gtin', 'barcode', 'upc', 'ean', 'identifier'],
        'brand': ['brand', 'vendor', 'manufacturer'],
        'description': ['description', 'title too short', 'missing description'],
        'image': ['image', 'picture', 'photo', 'resolution'],
        'price': ['price', 'cost', 'mismatch'],
        'availability': ['availability', 'stock', 'inventory', 'out of stock'],
        'shipping': ['shipping', 'delivery', 'transit'],
        'category': ['category', 'product_type', 'google_product_category'],
        'policy': ['policy', 'prohibited', 'restricted', 'adult']
    }

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.gmc_client = None
        self.shopify_fixer = None
        self._init_clients()

    def _init_clients(self):
        """Initialize GMC and Shopify clients if configured."""
        try:
            from ..tools.google_merchant import (
                GoogleMerchantClient,
                ShopifyGMCFixer,
                is_gmc_configured
            )

            if is_gmc_configured():
                self.gmc_client = GoogleMerchantClient()
                logger.info("[GMCAgent] Google Merchant Center client initialized")

                # Initialize Shopify fixer if configured
                import os
                shopify_domain = os.getenv('SHOPIFY_STORE_DOMAIN')
                shopify_token = os.getenv('SHOPIFY_ADMIN_API_TOKEN')

                if shopify_domain and shopify_token:
                    self.shopify_fixer = ShopifyGMCFixer(shopify_domain, shopify_token)
                    logger.info("[GMCAgent] Shopify GMC Fixer initialized")
            else:
                logger.warning("[GMCAgent] Google Merchant Center not configured")
        except Exception as e:
            logger.error(f"[GMCAgent] Failed to initialize clients: {e}")

    def _categorize_issue(self, description: str) -> str:
        """Categorize an issue based on its description."""
        description_lower = description.lower()

        for category, keywords in self.ISSUE_CATEGORIES.items():
            if any(kw in description_lower for kw in keywords):
                return category

        return 'other'

    def analyze(self, crawl_data: Dict[str, Any]) -> AgentResult:
        """
        Analyze Google Merchant Center feed for issues.

        Args:
            crawl_data: Crawl data (not used directly, but maintains interface)

        Returns:
            AgentResult with product feed issues and recommendations
        """
        logger.info("[GMCAgent] Starting Google Merchant Center analysis")

        tasks = []
        metadata = {
            'agent': self.name,
            'analyzed_at': datetime.now().isoformat(),
            'gmc_configured': self.gmc_client is not None
        }

        if not self.gmc_client:
            logger.warning("[GMCAgent] GMC not configured, skipping analysis")
            return AgentResult(
                agent_name=self.name,
                success=True,
                tasks=[],
                metadata={
                    **metadata,
                    'skipped': True,
                    'reason': 'Google Merchant Center not configured'
                }
            )

        try:
            # Get issues summary from GMC
            summary = self.gmc_client.get_issues_summary()

            metadata.update({
                'total_products': summary['total_products'],
                'products_with_issues': summary['products_with_issues'],
                'disapproved_products': summary['disapproved_products'],
                'issues_by_severity': summary['by_severity']
            })

            # Create tasks for each issue type
            issues_by_category = {}
            for issue in summary.get('issues', []):
                category = self._categorize_issue(issue['description'])
                if category not in issues_by_category:
                    issues_by_category[category] = []
                issues_by_category[category].append(issue)

            # Generate tasks for each category of issues
            for category, issues in issues_by_category.items():
                if not issues:
                    continue

                # Get highest severity in this category
                severities = [i['severity'] for i in issues]
                highest_severity = 'suggestion'
                for sev in ['critical', 'error', 'warning', 'suggestion']:
                    if sev in severities:
                        highest_severity = sev
                        break

                task = self._create_category_task(category, issues, highest_severity)
                if task:
                    tasks.append(task)

            # Add task for disapproved products (always high priority)
            if summary['disapproved_products'] > 0:
                disapproved_task = self._create_disapproved_task(summary)
                if disapproved_task:
                    tasks.insert(0, disapproved_task)  # First priority

            # Add feed health monitoring task
            health_task = self._create_health_task(summary)
            if health_task:
                tasks.append(health_task)

            logger.info(f"[GMCAgent] Analysis complete: {len(tasks)} tasks generated")

        except Exception as e:
            logger.error(f"[GMCAgent] Analysis failed: {e}")
            metadata['error'] = str(e)

        return AgentResult(
            agent_name=self.name,
            success=True,
            tasks=tasks,
            metadata=metadata
        )

    def _create_category_task(
        self,
        category: str,
        issues: List[Dict],
        severity: str
    ) -> Optional[Task]:
        """Create a task for a category of issues."""
        count = len(issues)
        priority = self.SEVERITY_PRIORITY.get(severity, Priority.LOW)

        # Determine risk based on category
        risk = Risk.LOW
        if category in ('policy', 'price', 'availability'):
            risk = Risk.MEDIUM

        # Build description
        sample_products = [i['title'] for i in issues[:3]]
        sample_text = ', '.join(sample_products)
        if count > 3:
            sample_text += f' and {count - 3} more'

        descriptions = {
            'gtin': f'Add GTIN/barcode to {count} products missing identifiers',
            'brand': f'Set brand to "Ayonne" for {count} products',
            'description': f'Add or improve descriptions for {count} products',
            'image': f'Fix image issues for {count} products (resolution/quality)',
            'price': f'Fix price mismatches for {count} products',
            'availability': f'Fix availability/stock issues for {count} products',
            'shipping': f'Configure shipping for {count} products',
            'category': f'Fix product category mapping for {count} products',
            'policy': f'Review {count} products for policy compliance',
            'other': f'Fix miscellaneous GMC issues for {count} products'
        }

        # Get fix suggestions if shopify fixer is available
        fix_details = None
        if self.shopify_fixer:
            from ..tools.google_merchant import ProductIssue
            sample_issue = ProductIssue(
                product_id=issues[0].get('product_id', ''),
                offer_id=issues[0].get('offer_id', ''),
                title=issues[0].get('title', ''),
                issue_type=issues[0].get('type', 'warning'),
                severity=severity,
                description=issues[0].get('description', '')
            )
            fix_details = self.shopify_fixer.analyze_issue(sample_issue)

        return Task(
            id=f"gmc_{category}_{count}",
            agent=self.name,
            priority=priority,
            risk=risk,
            title=f"GMC: Fix {category.replace('_', ' ').title()} Issues ({count} products)",
            description=descriptions.get(category, f'Fix {category} issues'),
            target_url='https://merchants.google.com/mc/products/diagnostics',
            implementation={
                'type': 'gmc_fix',
                'category': category,
                'affected_count': count,
                'sample_products': sample_products,
                'fix_suggestion': fix_details,
                'shopify_action': fix_details.get('action_required') if fix_details else 'manual'
            }
        )

    def _create_disapproved_task(self, summary: Dict) -> Optional[Task]:
        """Create high-priority task for disapproved products."""
        count = summary['disapproved_products']
        if count == 0:
            return None

        # Get disapproved product details
        disapproved = [
            i for i in summary.get('issues', [])
            if i.get('type') == 'disapproved'
        ]

        return Task(
            id=f"gmc_disapproved_{count}",
            agent=self.name,
            priority=Priority.CRITICAL,
            risk=Risk.HIGH,
            title=f"URGENT: {count} Products Disapproved in Google Shopping",
            description=(
                f"{count} products are disapproved and not showing in Google Shopping. "
                "These products cannot be discovered by potential customers searching on Google."
            ),
            target_url='https://merchants.google.com/mc/products/diagnostics?tab=disapproved',
            implementation={
                'type': 'gmc_disapproval',
                'affected_count': count,
                'products': [
                    {'id': i['product_id'], 'title': i['title'], 'issue': i['description']}
                    for i in disapproved[:10]
                ],
                'action_required': 'Fix issues in Shopify and request re-review in GMC'
            }
        )

    def _create_health_task(self, summary: Dict) -> Optional[Task]:
        """Create task for overall feed health if needed."""
        total = summary['total_products']
        with_issues = summary['products_with_issues']

        if total == 0:
            return Task(
                id="gmc_no_products",
                agent=self.name,
                priority=Priority.CRITICAL,
                risk=Risk.HIGH,
                title="No Products in Google Merchant Center",
                description=(
                    "No products found in Google Merchant Center. "
                    "Ensure Google Shopping channel is properly connected to Shopify."
                ),
                target_url='https://merchants.google.com/mc/products',
                implementation={
                    'type': 'gmc_setup',
                    'action_required': 'Connect Google Shopping channel in Shopify'
                }
            )

        # Calculate health percentage
        health_pct = ((total - with_issues) / total) * 100 if total > 0 else 0

        if health_pct < 80:
            return Task(
                id=f"gmc_health_{int(health_pct)}",
                agent=self.name,
                priority=Priority.MEDIUM,
                risk=Risk.LOW,
                title=f"GMC Feed Health: {health_pct:.0f}% ({with_issues} issues)",
                description=(
                    f"Product feed health is {health_pct:.0f}%. "
                    f"{with_issues} out of {total} products have issues that may affect visibility."
                ),
                target_url='https://merchants.google.com/mc/products/diagnostics',
                implementation={
                    'type': 'gmc_health',
                    'health_percentage': health_pct,
                    'total_products': total,
                    'products_with_issues': with_issues,
                    'by_severity': summary['by_severity'],
                    'recommendation': 'Address critical and error issues first'
                }
            )

        return None

    def get_fix_recommendations(self) -> Dict[str, Any]:
        """
        Get detailed fix recommendations for all GMC issues.

        Returns a report that can be used by admin dashboard.
        """
        if not self.gmc_client:
            return {'error': 'Google Merchant Center not configured'}

        try:
            # Get disapproved products
            disapproved = self.gmc_client.get_disapproved_products()

            if self.shopify_fixer:
                return self.shopify_fixer.generate_fix_report(disapproved)
            else:
                return {
                    'generated_at': datetime.now().isoformat(),
                    'total_issues': len(disapproved),
                    'issues': [
                        {
                            'product_id': i.product_id,
                            'offer_id': i.offer_id,
                            'title': i.title,
                            'severity': i.severity,
                            'description': i.description,
                            'resolution': i.resolution
                        }
                        for i in disapproved
                    ],
                    'note': 'Shopify integration not configured for auto-fix suggestions'
                }

        except Exception as e:
            logger.error(f"[GMCAgent] Failed to get recommendations: {e}")
            return {'error': str(e)}
