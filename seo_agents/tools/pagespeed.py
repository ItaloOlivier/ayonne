"""
PageSpeed Insights Checker

Uses Google's free PageSpeed Insights API to check Core Web Vitals.
"""

import logging
import time
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime

import requests
from ratelimit import limits, sleep_and_retry

logger = logging.getLogger(__name__)

# Free tier allows ~25 queries per day
PSI_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"


@dataclass
class CWVMetrics:
    """Core Web Vitals metrics."""
    lcp: Optional[float] = None  # Largest Contentful Paint (ms)
    cls: Optional[float] = None  # Cumulative Layout Shift
    inp: Optional[float] = None  # Interaction to Next Paint (ms)
    fcp: Optional[float] = None  # First Contentful Paint (ms)
    ttfb: Optional[float] = None  # Time to First Byte (ms)
    performance_score: Optional[int] = None  # 0-100
    accessibility_score: Optional[int] = None
    seo_score: Optional[int] = None
    best_practices_score: Optional[int] = None


@dataclass
class PageSpeedResult:
    """Result of PageSpeed analysis."""
    url: str
    device: str  # 'mobile' or 'desktop'
    timestamp: str
    metrics: CWVMetrics = field(default_factory=CWVMetrics)
    passed_cwv: bool = False
    opportunities: List[Dict] = field(default_factory=list)
    diagnostics: List[Dict] = field(default_factory=list)
    error: Optional[str] = None


class PageSpeedChecker:
    """
    Checks page performance using Google PageSpeed Insights API.

    Note: Free tier limited to ~25 queries per day.
    Optional API key increases quota.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        cwv_thresholds: Optional[Dict] = None
    ):
        self.api_key = api_key
        self.queries_today = 0
        self.max_queries_per_day = 400 if api_key else 25

        # Default CWV thresholds (Google's standards)
        self.thresholds = cwv_thresholds or {
            'lcp_good': 2500,
            'lcp_needs_improvement': 4000,
            'cls_good': 0.1,
            'cls_needs_improvement': 0.25,
            'inp_good': 200,
            'inp_needs_improvement': 500,
        }

    def can_query(self) -> bool:
        """Check if we have queries remaining."""
        return self.queries_today < self.max_queries_per_day

    @sleep_and_retry
    @limits(calls=1, period=2)  # Max 1 request per 2 seconds
    def _make_request(self, url: str, strategy: str) -> requests.Response:
        """Make rate-limited API request."""
        params = {
            'url': url,
            'strategy': strategy,
            'category': ['performance', 'accessibility', 'seo', 'best-practices']
        }

        if self.api_key:
            params['key'] = self.api_key

        return requests.get(PSI_API_URL, params=params, timeout=60)

    def analyze(self, url: str, device: str = 'mobile') -> PageSpeedResult:
        """
        Analyze a URL's performance.

        Args:
            url: URL to analyze
            device: 'mobile' or 'desktop'

        Returns:
            PageSpeedResult with metrics and recommendations
        """
        result = PageSpeedResult(
            url=url,
            device=device,
            timestamp=datetime.utcnow().isoformat()
        )

        if not self.can_query():
            result.error = "Daily query limit reached"
            logger.warning(f"PageSpeed query limit reached ({self.queries_today}/{self.max_queries_per_day})")
            return result

        try:
            logger.info(f"Analyzing {url} ({device})...")
            response = self._make_request(url, device)
            self.queries_today += 1

            if response.status_code != 200:
                result.error = f"API error: {response.status_code}"
                return result

            data = response.json()
            self._parse_response(data, result)

        except requests.Timeout:
            result.error = "Request timeout"
        except requests.RequestException as e:
            result.error = f"Request error: {str(e)}"
        except Exception as e:
            result.error = f"Parse error: {str(e)}"

        return result

    def _parse_response(self, data: dict, result: PageSpeedResult) -> None:
        """Parse PageSpeed Insights API response."""
        lighthouse = data.get('lighthouseResult', {})

        # Parse scores
        categories = lighthouse.get('categories', {})
        if 'performance' in categories:
            result.metrics.performance_score = int(categories['performance'].get('score', 0) * 100)
        if 'accessibility' in categories:
            result.metrics.accessibility_score = int(categories['accessibility'].get('score', 0) * 100)
        if 'seo' in categories:
            result.metrics.seo_score = int(categories['seo'].get('score', 0) * 100)
        if 'best-practices' in categories:
            result.metrics.best_practices_score = int(categories['best-practices'].get('score', 0) * 100)

        # Parse Core Web Vitals from audits
        audits = lighthouse.get('audits', {})

        # LCP
        if 'largest-contentful-paint' in audits:
            lcp_data = audits['largest-contentful-paint']
            result.metrics.lcp = lcp_data.get('numericValue')

        # CLS
        if 'cumulative-layout-shift' in audits:
            cls_data = audits['cumulative-layout-shift']
            result.metrics.cls = cls_data.get('numericValue')

        # INP (or TBT as proxy if INP not available)
        if 'interaction-to-next-paint' in audits:
            inp_data = audits['interaction-to-next-paint']
            result.metrics.inp = inp_data.get('numericValue')
        elif 'total-blocking-time' in audits:
            # Use TBT as INP proxy
            tbt_data = audits['total-blocking-time']
            result.metrics.inp = tbt_data.get('numericValue')

        # FCP
        if 'first-contentful-paint' in audits:
            fcp_data = audits['first-contentful-paint']
            result.metrics.fcp = fcp_data.get('numericValue')

        # TTFB
        if 'server-response-time' in audits:
            ttfb_data = audits['server-response-time']
            result.metrics.ttfb = ttfb_data.get('numericValue')

        # Check if passing CWV
        result.passed_cwv = self._check_cwv_pass(result.metrics)

        # Parse opportunities
        self._parse_opportunities(audits, result)

        # Parse diagnostics
        self._parse_diagnostics(audits, result)

    def _check_cwv_pass(self, metrics: CWVMetrics) -> bool:
        """Check if page passes Core Web Vitals."""
        passing = True

        if metrics.lcp is not None:
            passing = passing and metrics.lcp <= self.thresholds['lcp_good']

        if metrics.cls is not None:
            passing = passing and metrics.cls <= self.thresholds['cls_good']

        if metrics.inp is not None:
            passing = passing and metrics.inp <= self.thresholds['inp_good']

        return passing

    def _parse_opportunities(self, audits: dict, result: PageSpeedResult) -> None:
        """Parse performance opportunities."""
        opportunity_audits = [
            'render-blocking-resources',
            'unused-css-rules',
            'unused-javascript',
            'modern-image-formats',
            'uses-optimized-images',
            'uses-responsive-images',
            'offscreen-images',
            'unminified-css',
            'unminified-javascript',
            'efficient-animated-content',
            'uses-text-compression',
            'uses-rel-preconnect',
            'server-response-time',
            'redirects',
            'uses-rel-preload',
            'third-party-summary',
        ]

        for audit_id in opportunity_audits:
            if audit_id in audits:
                audit = audits[audit_id]
                # Only include if it has potential savings
                if audit.get('score', 1) < 1:
                    result.opportunities.append({
                        'id': audit_id,
                        'title': audit.get('title', ''),
                        'description': audit.get('description', ''),
                        'score': audit.get('score'),
                        'savings_ms': audit.get('numericValue', 0),
                        'display_value': audit.get('displayValue', '')
                    })

        # Sort by potential savings
        result.opportunities.sort(key=lambda x: x.get('savings_ms', 0), reverse=True)

    def _parse_diagnostics(self, audits: dict, result: PageSpeedResult) -> None:
        """Parse diagnostic information."""
        diagnostic_audits = [
            'dom-size',
            'mainthread-work-breakdown',
            'bootup-time',
            'font-display',
            'third-party-facades',
            'largest-contentful-paint-element',
            'layout-shift-elements',
            'long-tasks',
        ]

        for audit_id in diagnostic_audits:
            if audit_id in audits:
                audit = audits[audit_id]
                result.diagnostics.append({
                    'id': audit_id,
                    'title': audit.get('title', ''),
                    'description': audit.get('description', ''),
                    'display_value': audit.get('displayValue', '')
                })

    def analyze_multiple(
        self,
        urls: List[str],
        device: str = 'mobile'
    ) -> List[PageSpeedResult]:
        """
        Analyze multiple URLs.

        Respects rate limits and daily quota.
        """
        results = []

        for url in urls:
            if not self.can_query():
                logger.warning("Query limit reached, stopping batch analysis")
                break

            result = self.analyze(url, device)
            results.append(result)

            # Brief pause between requests
            time.sleep(1)

        return results

    def get_summary(self, results: List[PageSpeedResult]) -> Dict:
        """Generate summary statistics from multiple results."""
        successful = [r for r in results if not r.error]

        if not successful:
            return {'error': 'No successful results'}

        performance_scores = [r.metrics.performance_score for r in successful if r.metrics.performance_score]
        lcp_values = [r.metrics.lcp for r in successful if r.metrics.lcp]
        cls_values = [r.metrics.cls for r in successful if r.metrics.cls]

        return {
            'pages_analyzed': len(successful),
            'pages_passing_cwv': sum(1 for r in successful if r.passed_cwv),
            'avg_performance_score': sum(performance_scores) / len(performance_scores) if performance_scores else 0,
            'avg_lcp_ms': sum(lcp_values) / len(lcp_values) if lcp_values else 0,
            'avg_cls': sum(cls_values) / len(cls_values) if cls_values else 0,
            'top_opportunities': self._aggregate_opportunities(successful),
            'queries_remaining': self.max_queries_per_day - self.queries_today
        }

    def _aggregate_opportunities(self, results: List[PageSpeedResult]) -> List[Dict]:
        """Aggregate common opportunities across all pages."""
        opportunity_counts: Dict[str, Dict] = {}

        for result in results:
            for opp in result.opportunities:
                opp_id = opp['id']
                if opp_id not in opportunity_counts:
                    opportunity_counts[opp_id] = {
                        'id': opp_id,
                        'title': opp['title'],
                        'pages_affected': 0,
                        'total_savings_ms': 0
                    }
                opportunity_counts[opp_id]['pages_affected'] += 1
                opportunity_counts[opp_id]['total_savings_ms'] += opp.get('savings_ms', 0)

        # Sort by pages affected
        sorted_opps = sorted(
            opportunity_counts.values(),
            key=lambda x: x['pages_affected'],
            reverse=True
        )

        return sorted_opps[:10]  # Top 10
