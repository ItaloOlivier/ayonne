#!/usr/bin/env python3
"""
SEO Agent Runner

Entry point for the SEO agent system.

Usage:
    python -m seo_agents.run --config config/seo.yaml
    python -m seo_agents.run --config config/seo.yaml --dry-run
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime
from typing import Dict, Optional

import yaml

from .orchestrator import SEOCommander


def setup_logging(log_level: str = "INFO", log_file: Optional[str] = None) -> logging.Logger:
    """Configure logging."""
    logger = logging.getLogger("seo_agents")
    logger.setLevel(getattr(logging, log_level.upper()))

    # Console handler
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console.setFormatter(formatter)
    logger.addHandler(console)

    # File handler (optional)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


def load_config(config_path: str) -> Dict:
    """Load configuration from YAML file."""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Ayonne SEO Multi-Agent System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python -m seo_agents.run --config config/seo.yaml
    python -m seo_agents.run --config config/seo.yaml --dry-run
    python -m seo_agents.run --config config/seo.yaml --log-level DEBUG
        """
    )

    parser.add_argument(
        "--config",
        type=str,
        default="config/seo.yaml",
        help="Path to configuration file (default: config/seo.yaml)"
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without making any changes"
    )

    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging level (default: INFO)"
    )

    parser.add_argument(
        "--log-file",
        type=str,
        default=None,
        help="Log file path (optional)"
    )

    parser.add_argument(
        "--output-json",
        type=str,
        default=None,
        help="Output summary as JSON to specified file"
    )

    args = parser.parse_args()

    # Setup logging
    logger = setup_logging(args.log_level, args.log_file)

    logger.info("=" * 60)
    logger.info("Ayonne SEO Multi-Agent System")
    logger.info(f"Run Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    logger.info(f"Config: {args.config}")
    logger.info(f"Dry Run: {args.dry_run}")
    logger.info("=" * 60)

    # Load configuration
    try:
        config = load_config(args.config)
        logger.info("Configuration loaded successfully")
    except FileNotFoundError:
        logger.error(f"Configuration file not found: {args.config}")
        sys.exit(1)
    except yaml.YAMLError as e:
        logger.error(f"Invalid YAML in configuration: {e}")
        sys.exit(1)

    # Initialize and run commander
    try:
        commander = SEOCommander(config, logger)
        summary = commander.run(dry_run=args.dry_run)

        # Output results
        logger.info("=" * 60)
        logger.info("Run Complete")
        logger.info(f"Success: {summary.get('success', False)}")
        logger.info(f"Pages Crawled: {summary.get('pages_crawled', 0)}")
        logger.info(f"Tasks Found: {summary.get('total_tasks_found', 0)}")
        logger.info(f"Tasks Executed: {summary.get('tasks_executed', 0)}")
        logger.info("=" * 60)

        # Save JSON output if requested
        if args.output_json:
            with open(args.output_json, 'w') as f:
                json.dump(summary, f, indent=2)
            logger.info(f"Summary saved to {args.output_json}")

        # Exit with appropriate code
        if summary.get('success', False):
            sys.exit(0)
        else:
            sys.exit(1)

    except Exception as e:
        logger.exception(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
