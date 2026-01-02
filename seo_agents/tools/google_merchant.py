"""
Google Merchant Center API client for product feed management.

Monitors product issues, disapprovals, and can fix common problems
via Shopify Admin API updates.
"""

import os
import json
import logging
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from datetime import datetime
import requests

logger = logging.getLogger(__name__)


@dataclass
class ProductIssue:
    """Represents a Google Merchant Center product issue."""
    product_id: str
    offer_id: str  # Usually the Shopify variant ID or SKU
    title: str
    issue_type: str  # disapproved, demoted, unaffected
    severity: str  # critical, error, warning, suggestion
    description: str
    documentation_url: Optional[str] = None
    applicable_countries: Optional[List[str]] = None
    resolution: Optional[str] = None

    @property
    def is_disapproved(self) -> bool:
        return self.issue_type == 'disapproved'

    @property
    def is_critical(self) -> bool:
        return self.severity in ('critical', 'error')


@dataclass
class MerchantProduct:
    """Represents a product in Google Merchant Center."""
    id: str
    offer_id: str
    title: str
    link: str
    price: str
    availability: str
    condition: str
    brand: str
    gtin: Optional[str] = None
    mpn: Optional[str] = None
    image_link: Optional[str] = None
    description: Optional[str] = None
    product_type: Optional[str] = None
    google_product_category: Optional[str] = None
    issues: List[ProductIssue] = None
    is_priority: bool = False  # High-revenue or featured product
    priority_reason: Optional[str] = None

    def __post_init__(self):
        if self.issues is None:
            self.issues = []

    @property
    def price_value(self) -> float:
        """Extract numeric price value."""
        try:
            return float(self.price.replace('USD', '').replace('$', '').strip())
        except (ValueError, AttributeError):
            return 0.0


# Default list of priority product handles (high-revenue items)
PRIORITY_PRODUCT_HANDLES = [
    'vitamin-c-lotion-1',
    'collagen-and-retinol-serum-1',
    'hyaluronic-acid-serum-1',
    'niacinamide-serum',
    'peptide-complex-serum',
    'vitamin-c-serum-1',
    'retinol-serum-1',
]

# Price threshold for auto-flagging as priority
HIGH_VALUE_PRICE_THRESHOLD = 50.0


class GoogleMerchantClient:
    """
    Client for Google Merchant Center Content API.

    Requires a service account with Merchant Center access.
    Set GOOGLE_MERCHANT_ID and GOOGLE_SERVICE_ACCOUNT_KEY env vars.
    """

    BASE_URL = "https://shoppingcontent.googleapis.com/content/v2.1"

    def __init__(self, merchant_id: Optional[str] = None):
        self.merchant_id = merchant_id or os.getenv('GOOGLE_MERCHANT_ID')
        self._access_token = None
        self._token_expires = None

    def is_configured(self) -> bool:
        """Check if Google Merchant Center is configured."""
        return bool(
            self.merchant_id and
            os.getenv('GOOGLE_SERVICE_ACCOUNT_KEY')
        )

    def _get_access_token(self) -> str:
        """Get OAuth2 access token from service account."""
        if self._access_token and self._token_expires:
            if datetime.now() < self._token_expires:
                return self._access_token

        try:
            # Try using google-auth library if available
            from google.oauth2 import service_account
            from google.auth.transport.requests import Request

            key_json = os.getenv('GOOGLE_SERVICE_ACCOUNT_KEY')
            if not key_json:
                raise ValueError("GOOGLE_SERVICE_ACCOUNT_KEY not set")

            credentials = service_account.Credentials.from_service_account_info(
                json.loads(key_json),
                scopes=['https://www.googleapis.com/auth/content']
            )
            credentials.refresh(Request())
            self._access_token = credentials.token
            self._token_expires = credentials.expiry
            return self._access_token

        except ImportError:
            # Fallback: Manual JWT token generation
            logger.warning("google-auth not installed, using manual JWT")
            return self._generate_jwt_token()

    def _generate_jwt_token(self) -> str:
        """Generate JWT token manually (fallback without google-auth)."""
        import time
        import hashlib
        import hmac
        import base64

        key_json = json.loads(os.getenv('GOOGLE_SERVICE_ACCOUNT_KEY', '{}'))

        # JWT Header
        header = base64.urlsafe_b64encode(json.dumps({
            "alg": "RS256",
            "typ": "JWT"
        }).encode()).decode().rstrip('=')

        # JWT Payload
        now = int(time.time())
        payload = base64.urlsafe_b64encode(json.dumps({
            "iss": key_json.get('client_email'),
            "scope": "https://www.googleapis.com/auth/content",
            "aud": "https://oauth2.googleapis.com/token",
            "iat": now,
            "exp": now + 3600
        }).encode()).decode().rstrip('=')

        # This requires cryptography library for RS256
        # For production, use google-auth library instead
        raise NotImplementedError(
            "Manual JWT requires cryptography library. "
            "Install google-auth: pip install google-auth"
        )

    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make authenticated request to Merchant Center API."""
        if not self.is_configured():
            raise ValueError("Google Merchant Center not configured")

        url = f"{self.BASE_URL}/{self.merchant_id}/{endpoint}"
        headers = {
            "Authorization": f"Bearer {self._get_access_token()}",
            "Content-Type": "application/json"
        }

        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=data,
            timeout=30
        )

        if response.status_code == 401:
            # Token expired, retry
            self._access_token = None
            headers["Authorization"] = f"Bearer {self._get_access_token()}"
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                timeout=30
            )

        response.raise_for_status()
        return response.json() if response.text else {}

    def get_product_statuses(self, max_results: int = 250) -> List[MerchantProduct]:
        """
        Get all products with their approval status and issues.

        Returns list of MerchantProduct with issues populated.
        Priority products are automatically flagged.
        """
        products = []
        page_token = None

        while True:
            params = f"maxResults={max_results}"
            if page_token:
                params += f"&pageToken={page_token}"

            response = self._request("GET", f"productstatuses?{params}")

            for item in response.get('resources', []):
                product = MerchantProduct(
                    id=item.get('productId', ''),
                    offer_id=item.get('productId', '').split(':')[-1],
                    title=item.get('title', ''),
                    link=item.get('link', ''),
                    price='',
                    availability='',
                    condition='',
                    brand='',
                )

                # Parse issues
                for issue in item.get('itemLevelIssues', []):
                    product.issues.append(ProductIssue(
                        product_id=product.id,
                        offer_id=product.offer_id,
                        title=product.title,
                        issue_type=issue.get('servability', 'unaffected'),
                        severity=issue.get('severity', 'warning'),
                        description=issue.get('description', ''),
                        documentation_url=issue.get('documentation', ''),
                        applicable_countries=issue.get('applicableCountries', []),
                        resolution=issue.get('resolution', '')
                    ))

                # Flag priority products
                self._flag_priority_product(product)

                products.append(product)

            page_token = response.get('nextPageToken')
            if not page_token:
                break

        return products

    def _flag_priority_product(self, product: MerchantProduct) -> None:
        """Flag product as priority if it meets criteria."""
        link_lower = product.link.lower()

        # Check if in priority product list
        for handle in PRIORITY_PRODUCT_HANDLES:
            if handle in link_lower:
                product.is_priority = True
                product.priority_reason = 'High-revenue product'
                return

        # Check price threshold
        if product.price_value >= HIGH_VALUE_PRICE_THRESHOLD:
            product.is_priority = True
            product.priority_reason = f'High-value product (${product.price_value:.2f})'
            return

        # Check if featured (contains "best seller" or "featured" in title)
        title_lower = product.title.lower()
        if 'best seller' in title_lower or 'featured' in title_lower:
            product.is_priority = True
            product.priority_reason = 'Featured product'

    def get_product(self, product_id: str) -> Optional[MerchantProduct]:
        """Get a single product by ID."""
        try:
            response = self._request("GET", f"products/{product_id}")
            return MerchantProduct(
                id=response.get('id', ''),
                offer_id=response.get('offerId', ''),
                title=response.get('title', ''),
                link=response.get('link', ''),
                price=response.get('price', {}).get('value', ''),
                availability=response.get('availability', ''),
                condition=response.get('condition', ''),
                brand=response.get('brand', ''),
                gtin=response.get('gtin'),
                mpn=response.get('mpn'),
                image_link=response.get('imageLink'),
                description=response.get('description'),
                product_type=response.get('productTypes', [None])[0],
                google_product_category=response.get('googleProductCategory'),
            )
        except Exception as e:
            logger.error(f"Failed to get product {product_id}: {e}")
            return None

    def update_product(self, product_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a product in Google Merchant Center.

        Note: For Shopify stores, updates should go through Shopify
        and sync to GMC automatically. This is for direct GMC updates only.
        """
        try:
            self._request("PATCH", f"products/{product_id}", updates)
            logger.info(f"Updated GMC product {product_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to update product {product_id}: {e}")
            return False

    def get_issues_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all product issues.

        Returns counts by severity and common issue types.
        Priority products with issues are highlighted separately.
        """
        products = self.get_product_statuses()

        summary = {
            'total_products': len(products),
            'products_with_issues': 0,
            'disapproved_products': 0,
            'priority_products_total': 0,
            'priority_products_with_issues': 0,
            'priority_products_disapproved': 0,
            'by_severity': {
                'critical': 0,
                'error': 0,
                'warning': 0,
                'suggestion': 0
            },
            'common_issues': {},
            'issues': [],
            'priority_issues': []  # Issues on high-revenue products
        }

        for product in products:
            is_priority = product.is_priority
            if is_priority:
                summary['priority_products_total'] += 1

            if product.issues:
                summary['products_with_issues'] += 1

                if is_priority:
                    summary['priority_products_with_issues'] += 1

                is_disapproved = any(i.is_disapproved for i in product.issues)
                if is_disapproved:
                    summary['disapproved_products'] += 1
                    if is_priority:
                        summary['priority_products_disapproved'] += 1

                for issue in product.issues:
                    # Count by severity
                    if issue.severity in summary['by_severity']:
                        summary['by_severity'][issue.severity] += 1

                    # Track common issues
                    issue_key = issue.description[:100]
                    if issue_key not in summary['common_issues']:
                        summary['common_issues'][issue_key] = {
                            'count': 0,
                            'severity': issue.severity,
                            'resolution': issue.resolution,
                            'documentation': issue.documentation_url
                        }
                    summary['common_issues'][issue_key]['count'] += 1

                    # Build issue record
                    issue_record = {
                        'product_id': issue.product_id,
                        'offer_id': issue.offer_id,
                        'title': issue.title,
                        'type': issue.issue_type,
                        'severity': issue.severity,
                        'description': issue.description,
                        'resolution': issue.resolution,
                        'is_priority': is_priority,
                        'priority_reason': product.priority_reason
                    }

                    # Add to issues list
                    summary['issues'].append(issue_record)

                    # Also add to priority issues if applicable
                    if is_priority:
                        summary['priority_issues'].append(issue_record)

        # Sort common issues by count
        summary['common_issues'] = dict(
            sorted(
                summary['common_issues'].items(),
                key=lambda x: x[1]['count'],
                reverse=True
            )[:10]  # Top 10 issues
        )

        # Sort priority issues by severity (critical first)
        severity_order = {'critical': 0, 'error': 1, 'warning': 2, 'suggestion': 3}
        summary['priority_issues'].sort(
            key=lambda x: severity_order.get(x['severity'], 4)
        )

        return summary

    def get_disapproved_products(self) -> List[ProductIssue]:
        """Get all disapproved products with their issues."""
        products = self.get_product_statuses()
        disapproved = []

        for product in products:
            for issue in product.issues:
                if issue.is_disapproved:
                    disapproved.append(issue)

        return disapproved


class ShopifyGMCFixer:
    """
    Fixes Google Merchant Center issues by updating products in Shopify.

    Uses Shopify Admin API to update product data which then syncs to GMC.
    """

    COMMON_FIXES = {
        'missing_gtin': {
            'description': 'Add GTIN/barcode to product',
            'field': 'barcode',
            'auto_fix': False
        },
        'missing_brand': {
            'description': 'Add brand to product',
            'field': 'vendor',
            'auto_fix': True,
            'default_value': 'Ayonne'
        },
        'missing_description': {
            'description': 'Add product description',
            'field': 'body_html',
            'auto_fix': False
        },
        'image_too_small': {
            'description': 'Replace with higher resolution image',
            'field': 'images',
            'auto_fix': False
        },
        'price_mismatch': {
            'description': 'Sync price between Shopify and landing page',
            'field': 'variants.price',
            'auto_fix': False
        },
        'availability_mismatch': {
            'description': 'Update inventory tracking',
            'field': 'variants.inventory_quantity',
            'auto_fix': False
        }
    }

    def __init__(self, shopify_domain: str, shopify_token: str):
        self.shopify_domain = shopify_domain
        self.shopify_token = shopify_token
        self.api_version = '2024-01'

    def _shopify_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make request to Shopify Admin API."""
        url = f"https://{self.shopify_domain}/admin/api/{self.api_version}/{endpoint}"
        headers = {
            "X-Shopify-Access-Token": self.shopify_token,
            "Content-Type": "application/json"
        }

        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=data,
            timeout=30
        )
        response.raise_for_status()
        return response.json() if response.text else {}

    def get_product_by_sku(self, sku: str) -> Optional[Dict]:
        """Find Shopify product by SKU/variant ID."""
        # Search by SKU in variants
        response = self._shopify_request(
            "GET",
            f"variants.json?sku={sku}"
        )

        variants = response.get('variants', [])
        if variants:
            product_id = variants[0].get('product_id')
            return self._shopify_request("GET", f"products/{product_id}.json").get('product')

        return None

    def fix_missing_brand(self, product_id: int, brand: str = 'Ayonne') -> bool:
        """Fix missing brand by updating vendor field."""
        try:
            self._shopify_request(
                "PUT",
                f"products/{product_id}.json",
                {"product": {"id": product_id, "vendor": brand}}
            )
            logger.info(f"Fixed brand for product {product_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to fix brand for {product_id}: {e}")
            return False

    def fix_missing_gtin(self, variant_id: int, gtin: str) -> bool:
        """Fix missing GTIN/barcode."""
        try:
            self._shopify_request(
                "PUT",
                f"variants/{variant_id}.json",
                {"variant": {"id": variant_id, "barcode": gtin}}
            )
            logger.info(f"Fixed GTIN for variant {variant_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to fix GTIN for {variant_id}: {e}")
            return False

    def analyze_issue(self, issue: ProductIssue) -> Dict[str, Any]:
        """
        Analyze a GMC issue and suggest fixes.

        Returns fix suggestion with whether it can be auto-fixed.
        """
        description_lower = issue.description.lower()

        result = {
            'issue': issue.description,
            'severity': issue.severity,
            'can_auto_fix': False,
            'fix_type': None,
            'fix_description': None,
            'shopify_field': None,
            'action_required': 'manual'
        }

        # Detect issue type and suggest fix
        if 'gtin' in description_lower or 'barcode' in description_lower:
            result.update({
                'fix_type': 'missing_gtin',
                'fix_description': 'Add UPC/EAN barcode to product variant in Shopify',
                'shopify_field': 'variant.barcode',
                'action_required': 'Add barcode in Shopify Admin > Products > Edit variant'
            })

        elif 'brand' in description_lower:
            result.update({
                'fix_type': 'missing_brand',
                'fix_description': 'Set vendor/brand to "Ayonne" in Shopify',
                'shopify_field': 'product.vendor',
                'can_auto_fix': True,
                'action_required': 'auto'
            })

        elif 'description' in description_lower:
            result.update({
                'fix_type': 'missing_description',
                'fix_description': 'Add detailed product description (min 100 chars)',
                'shopify_field': 'product.body_html',
                'action_required': 'Add description in Shopify Admin > Products > Edit'
            })

        elif 'image' in description_lower:
            result.update({
                'fix_type': 'image_issue',
                'fix_description': 'Replace with high-res image (min 100x100, recommended 800x800)',
                'shopify_field': 'product.images',
                'action_required': 'Upload higher quality product image in Shopify'
            })

        elif 'price' in description_lower:
            result.update({
                'fix_type': 'price_mismatch',
                'fix_description': 'Ensure price matches between Shopify and product page',
                'shopify_field': 'variant.price',
                'action_required': 'Verify price is consistent across all channels'
            })

        elif 'availability' in description_lower or 'stock' in description_lower:
            result.update({
                'fix_type': 'availability_mismatch',
                'fix_description': 'Update inventory status in Shopify',
                'shopify_field': 'variant.inventory_quantity',
                'action_required': 'Check inventory tracking settings in Shopify'
            })

        elif 'shipping' in description_lower:
            result.update({
                'fix_type': 'shipping_issue',
                'fix_description': 'Configure shipping settings in Google Merchant Center',
                'action_required': 'Update shipping settings in GMC dashboard'
            })

        return result

    def generate_fix_report(self, issues: List[ProductIssue]) -> Dict[str, Any]:
        """
        Generate a report of all issues with fix suggestions.

        Groups by fix type and prioritizes by severity.
        """
        report = {
            'generated_at': datetime.now().isoformat(),
            'total_issues': len(issues),
            'auto_fixable': 0,
            'manual_required': 0,
            'by_fix_type': {},
            'fixes': []
        }

        for issue in issues:
            analysis = self.analyze_issue(issue)

            if analysis['can_auto_fix']:
                report['auto_fixable'] += 1
            else:
                report['manual_required'] += 1

            fix_type = analysis.get('fix_type', 'unknown')
            if fix_type not in report['by_fix_type']:
                report['by_fix_type'][fix_type] = {
                    'count': 0,
                    'description': analysis.get('fix_description', ''),
                    'can_auto_fix': analysis['can_auto_fix']
                }
            report['by_fix_type'][fix_type]['count'] += 1

            report['fixes'].append({
                'product_id': issue.product_id,
                'offer_id': issue.offer_id,
                'title': issue.title,
                **analysis
            })

        # Sort by severity (critical first)
        severity_order = {'critical': 0, 'error': 1, 'warning': 2, 'suggestion': 3}
        report['fixes'].sort(key=lambda x: severity_order.get(x['severity'], 4))

        return report


class GMCAutoFixer:
    """
    Automatically fixes low-risk GMC issues via Shopify API.

    Only fixes issues that are:
    - Low risk (won't break products or lose data)
    - Reversible (can be undone easily)
    - Well-defined (have clear fix actions)
    """

    # Issues that can be safely auto-fixed
    AUTO_FIXABLE_ISSUES = {
        'missing_brand': {
            'risk': 'low',
            'action': 'set_vendor',
            'value': 'Ayonne',
            'reversible': True
        },
        'missing_product_type': {
            'risk': 'low',
            'action': 'set_product_type',
            'value': 'Health & Beauty > Skin Care',
            'reversible': True
        }
    }

    def __init__(self, shopify_fixer: ShopifyGMCFixer):
        self.shopify_fixer = shopify_fixer
        self.fixes_applied = []
        self.fixes_failed = []

    def can_auto_fix(self, issue: ProductIssue) -> bool:
        """Check if an issue can be safely auto-fixed."""
        description_lower = issue.description.lower()

        # Only auto-fix brand issues for now (safest)
        if 'brand' in description_lower or 'vendor' in description_lower:
            return True

        return False

    def auto_fix_issue(self, issue: ProductIssue, dry_run: bool = False) -> Dict[str, Any]:
        """
        Attempt to auto-fix a GMC issue.

        Returns result with success status and details.
        """
        result = {
            'product_id': issue.product_id,
            'offer_id': issue.offer_id,
            'title': issue.title,
            'issue': issue.description,
            'fix_attempted': False,
            'fix_type': None,
            'success': False,
            'dry_run': dry_run,
            'error': None
        }

        description_lower = issue.description.lower()

        try:
            # Fix missing brand
            if 'brand' in description_lower or 'vendor' in description_lower:
                result['fix_type'] = 'set_brand_to_ayonne'
                result['fix_attempted'] = True

                if dry_run:
                    result['success'] = True
                    result['message'] = 'Would set vendor to "Ayonne"'
                else:
                    # Get Shopify product from offer_id (usually SKU or variant ID)
                    product = self.shopify_fixer.get_product_by_sku(issue.offer_id)
                    if product:
                        success = self.shopify_fixer.fix_missing_brand(product['id'])
                        result['success'] = success
                        if success:
                            result['message'] = 'Set vendor to "Ayonne"'
                            self.fixes_applied.append(result)
                        else:
                            result['error'] = 'Shopify API call failed'
                            self.fixes_failed.append(result)
                    else:
                        result['error'] = f'Product not found in Shopify for SKU: {issue.offer_id}'
                        self.fixes_failed.append(result)

        except Exception as e:
            result['error'] = str(e)
            self.fixes_failed.append(result)
            logger.error(f"Auto-fix failed for {issue.product_id}: {e}")

        return result

    def auto_fix_all(self, issues: List[ProductIssue], dry_run: bool = False) -> Dict[str, Any]:
        """
        Auto-fix all eligible issues.

        Returns summary of fixes applied.
        """
        results = {
            'total_issues': len(issues),
            'eligible_for_auto_fix': 0,
            'fixes_attempted': 0,
            'fixes_succeeded': 0,
            'fixes_failed': 0,
            'dry_run': dry_run,
            'details': []
        }

        for issue in issues:
            if self.can_auto_fix(issue):
                results['eligible_for_auto_fix'] += 1
                fix_result = self.auto_fix_issue(issue, dry_run)

                if fix_result['fix_attempted']:
                    results['fixes_attempted'] += 1
                    if fix_result['success']:
                        results['fixes_succeeded'] += 1
                    else:
                        results['fixes_failed'] += 1

                results['details'].append(fix_result)

        return results

    def get_fix_summary(self) -> Dict[str, Any]:
        """Get summary of fixes applied in this session."""
        return {
            'fixes_applied': len(self.fixes_applied),
            'fixes_failed': len(self.fixes_failed),
            'applied_details': self.fixes_applied,
            'failed_details': self.fixes_failed
        }


class GMCAlertManager:
    """
    Manages alerts for critical GMC issues.

    Supports Slack webhooks and email notifications.
    """

    def __init__(self):
        self.slack_webhook = os.getenv('SLACK_WEBHOOK_URL')
        self.alert_email = os.getenv('GMC_ALERT_EMAIL')
        self.alerts_sent = []

    def should_alert(self, summary: Dict[str, Any]) -> bool:
        """Check if the GMC status warrants an alert."""
        # Alert if any products are disapproved
        if summary.get('disapproved_products', 0) > 0:
            return True

        # Alert if critical issues exist
        if summary.get('by_severity', {}).get('critical', 0) > 0:
            return True

        # Alert if feed health drops below 70%
        total = summary.get('total_products', 0)
        with_issues = summary.get('products_with_issues', 0)
        if total > 0:
            health = ((total - with_issues) / total) * 100
            if health < 70:
                return True

        return False

    def format_alert_message(self, summary: Dict[str, Any]) -> Dict[str, str]:
        """Format alert message for different channels."""
        total = summary.get('total_products', 0)
        disapproved = summary.get('disapproved_products', 0)
        with_issues = summary.get('products_with_issues', 0)
        health = ((total - with_issues) / total * 100) if total > 0 else 100

        severity = summary.get('by_severity', {})

        # Plain text for email
        text = f"""🚨 GMC Alert: Ayonne Product Feed Issues

Feed Health: {health:.0f}%
Total Products: {total}
Products with Issues: {with_issues}
Disapproved Products: {disapproved}

Issues by Severity:
- Critical: {severity.get('critical', 0)}
- Error: {severity.get('error', 0)}
- Warning: {severity.get('warning', 0)}

Action Required: Review Google Merchant Center dashboard
https://merchants.google.com/mc/products/diagnostics

---
Sent by Ayonne SEO Agent
"""

        # Slack Block Kit format
        slack_blocks = {
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "🚨 GMC Alert: Product Feed Issues",
                        "emoji": True
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Feed Health:* {health:.0f}%"},
                        {"type": "mrkdwn", "text": f"*Total Products:* {total}"},
                        {"type": "mrkdwn", "text": f"*With Issues:* {with_issues}"},
                        {"type": "mrkdwn", "text": f"*Disapproved:* {disapproved}"}
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Issues:* 🔴 {severity.get('critical', 0)} critical | 🟠 {severity.get('error', 0)} error | 🟡 {severity.get('warning', 0)} warning"
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "View in GMC"},
                            "url": "https://merchants.google.com/mc/products/diagnostics",
                            "style": "danger"
                        }
                    ]
                }
            ]
        }

        return {
            'text': text,
            'slack': slack_blocks
        }

    def send_slack_alert(self, message: Dict) -> bool:
        """Send alert to Slack webhook."""
        if not self.slack_webhook:
            logger.warning("Slack webhook not configured")
            return False

        try:
            response = requests.post(
                self.slack_webhook,
                json=message['slack'],
                timeout=10
            )
            response.raise_for_status()
            logger.info("Slack alert sent successfully")
            self.alerts_sent.append({
                'channel': 'slack',
                'timestamp': datetime.now().isoformat(),
                'success': True
            })
            return True
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")
            return False

    def send_alert(self, summary: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send alerts for GMC issues.

        Returns status of alert delivery.
        """
        if not self.should_alert(summary):
            return {'alert_required': False}

        message = self.format_alert_message(summary)
        result = {
            'alert_required': True,
            'slack_sent': False,
            'email_sent': False
        }

        # Send Slack alert
        if self.slack_webhook:
            result['slack_sent'] = self.send_slack_alert(message)

        # Email alerts would require SMTP setup
        # For now, log the alert
        if self.alert_email:
            logger.info(f"Email alert would be sent to {self.alert_email}")
            # TODO: Implement email sending

        return result


class GMCHealthMonitor:
    """
    Monitors GMC feed health over time and tracks trends.
    """

    def __init__(self, history_file: str = 'runs/gmc_health_history.json'):
        self.history_file = history_file
        self.history = self._load_history()

    def _load_history(self) -> List[Dict]:
        """Load health history from file."""
        try:
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load GMC health history: {e}")
        return []

    def _save_history(self):
        """Save health history to file."""
        try:
            os.makedirs(os.path.dirname(self.history_file), exist_ok=True)
            with open(self.history_file, 'w') as f:
                json.dump(self.history[-90:], f, indent=2)  # Keep 90 days
        except Exception as e:
            logger.error(f"Failed to save GMC health history: {e}")

    def record_snapshot(self, summary: Dict[str, Any]) -> Dict[str, Any]:
        """Record a health snapshot."""
        total = summary.get('total_products', 0)
        with_issues = summary.get('products_with_issues', 0)

        snapshot = {
            'timestamp': datetime.now().isoformat(),
            'date': datetime.now().strftime('%Y-%m-%d'),
            'total_products': total,
            'products_with_issues': with_issues,
            'disapproved_products': summary.get('disapproved_products', 0),
            'health_percentage': ((total - with_issues) / total * 100) if total > 0 else 100,
            'by_severity': summary.get('by_severity', {})
        }

        self.history.append(snapshot)
        self._save_history()

        return snapshot

    def get_trend(self, days: int = 7) -> Dict[str, Any]:
        """Get health trend over the specified days."""
        if not self.history:
            return {'error': 'No history available'}

        recent = self.history[-days:]
        if len(recent) < 2:
            return {'error': 'Not enough data for trend analysis'}

        first = recent[0]
        last = recent[-1]

        health_change = last['health_percentage'] - first['health_percentage']
        disapproved_change = last['disapproved_products'] - first['disapproved_products']

        return {
            'period_days': len(recent),
            'start_date': first['date'],
            'end_date': last['date'],
            'health_trend': 'improving' if health_change > 0 else 'declining' if health_change < 0 else 'stable',
            'health_change': round(health_change, 1),
            'current_health': round(last['health_percentage'], 1),
            'disapproved_change': disapproved_change,
            'current_disapproved': last['disapproved_products'],
            'history': recent
        }

    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get data formatted for admin dashboard."""
        trend = self.get_trend(7)

        if 'error' in trend:
            return trend

        return {
            'current': {
                'health': trend['current_health'],
                'disapproved': trend['current_disapproved'],
                'status': 'healthy' if trend['current_health'] >= 80 else 'warning' if trend['current_health'] >= 60 else 'critical'
            },
            'trend': {
                'direction': trend['health_trend'],
                'change': trend['health_change'],
                'period': f"{trend['period_days']} days"
            },
            'chart_data': [
                {'date': h['date'], 'health': round(h['health_percentage'], 1), 'disapproved': h['disapproved_products']}
                for h in trend['history']
            ]
        }


def is_gmc_configured() -> bool:
    """Check if Google Merchant Center integration is configured."""
    return bool(
        os.getenv('GOOGLE_MERCHANT_ID') and
        os.getenv('GOOGLE_SERVICE_ACCOUNT_KEY')
    )


def get_gmc_summary() -> Optional[Dict[str, Any]]:
    """Get GMC issues summary if configured."""
    if not is_gmc_configured():
        return None

    try:
        client = GoogleMerchantClient()
        return client.get_issues_summary()
    except Exception as e:
        logger.error(f"Failed to get GMC summary: {e}")
        return {'error': str(e)}


def run_gmc_health_check(
    auto_fix: bool = False,
    send_alerts: bool = True,
    dry_run: bool = False
) -> Dict[str, Any]:
    """
    Run a complete GMC health check with optional auto-fix and alerts.

    This is the main entry point for scheduled GMC monitoring.

    Args:
        auto_fix: Whether to auto-fix eligible issues
        send_alerts: Whether to send alerts for critical issues
        dry_run: If True, don't make actual changes

    Returns:
        Complete health check report
    """
    if not is_gmc_configured():
        return {'error': 'Google Merchant Center not configured'}

    result = {
        'timestamp': datetime.now().isoformat(),
        'dry_run': dry_run,
        'summary': None,
        'health_recorded': False,
        'auto_fix': None,
        'alerts': None,
        'dashboard': None
    }

    try:
        # Get GMC summary
        client = GoogleMerchantClient()
        summary = client.get_issues_summary()
        result['summary'] = summary

        # Record health snapshot
        monitor = GMCHealthMonitor()
        monitor.record_snapshot(summary)
        result['health_recorded'] = True
        result['dashboard'] = monitor.get_dashboard_data()

        # Auto-fix if enabled
        if auto_fix:
            shopify_domain = os.getenv('SHOPIFY_STORE_DOMAIN')
            shopify_token = os.getenv('SHOPIFY_ADMIN_API_TOKEN')

            if shopify_domain and shopify_token:
                shopify_fixer = ShopifyGMCFixer(shopify_domain, shopify_token)
                auto_fixer = GMCAutoFixer(shopify_fixer)

                # Get all issues and attempt auto-fix
                issues = client.get_disapproved_products()
                result['auto_fix'] = auto_fixer.auto_fix_all(issues, dry_run)
            else:
                result['auto_fix'] = {'error': 'Shopify not configured for auto-fix'}

        # Send alerts if enabled
        if send_alerts:
            alert_manager = GMCAlertManager()
            result['alerts'] = alert_manager.send_alert(summary)

    except Exception as e:
        logger.error(f"GMC health check failed: {e}")
        result['error'] = str(e)

    return result
