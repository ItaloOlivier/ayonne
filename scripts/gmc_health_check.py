#!/usr/bin/env python3
"""
GMC Health Check Script

Standalone script to run Google Merchant Center health checks.
Can be called from the admin API endpoint or run directly.

Usage:
    python3 scripts/gmc_health_check.py [--auto-fix] [--send-alerts] [--dry-run]
"""

import argparse
import json
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from seo_agents.tools.google_merchant import run_gmc_health_check


def main():
    parser = argparse.ArgumentParser(description='Run GMC health check')
    parser.add_argument(
        '--auto-fix',
        action='store_true',
        help='Automatically fix eligible issues'
    )
    parser.add_argument(
        '--send-alerts',
        action='store_true',
        help='Send alerts for critical issues'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without making actual changes'
    )
    parser.add_argument(
        '--output',
        type=str,
        help='Output file path (default: stdout)'
    )

    args = parser.parse_args()

    # Run health check
    result = run_gmc_health_check(
        auto_fix=args.auto_fix,
        send_alerts=args.send_alerts,
        dry_run=args.dry_run
    )

    # Output result
    output = json.dumps(result, indent=2, default=str)

    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
    else:
        print(output)

    # Save latest summary for API access
    if result.get('summary'):
        summary_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'runs',
            'gmc_latest_summary.json'
        )
        os.makedirs(os.path.dirname(summary_path), exist_ok=True)
        with open(summary_path, 'w') as f:
            json.dump(result['summary'], f, indent=2, default=str)

    # Exit with error code if check failed
    if result.get('error'):
        sys.exit(1)


if __name__ == '__main__':
    main()
