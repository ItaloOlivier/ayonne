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

    def __post_init__(self):
        if self.issues is None:
            self.issues = []


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

                products.append(product)

            page_token = response.get('nextPageToken')
            if not page_token:
                break

        return products

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
        """
        products = self.get_product_statuses()

        summary = {
            'total_products': len(products),
            'products_with_issues': 0,
            'disapproved_products': 0,
            'by_severity': {
                'critical': 0,
                'error': 0,
                'warning': 0,
                'suggestion': 0
            },
            'common_issues': {},
            'issues': []
        }

        for product in products:
            if product.issues:
                summary['products_with_issues'] += 1

                if any(i.is_disapproved for i in product.issues):
                    summary['disapproved_products'] += 1

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

                    # Add to issues list
                    summary['issues'].append({
                        'product_id': issue.product_id,
                        'offer_id': issue.offer_id,
                        'title': issue.title,
                        'type': issue.issue_type,
                        'severity': issue.severity,
                        'description': issue.description,
                        'resolution': issue.resolution
                    })

        # Sort common issues by count
        summary['common_issues'] = dict(
            sorted(
                summary['common_issues'].items(),
                key=lambda x: x[1]['count'],
                reverse=True
            )[:10]  # Top 10 issues
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
