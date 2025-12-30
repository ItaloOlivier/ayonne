"""
Ayonne SEO Multi-Agent System

An autonomous SEO optimization system that runs daily to analyze and improve
both ayonne.skin (Shopify) and ai.ayonne.skin (Next.js).

Usage:
    python -m seo_agents.run --config config/seo.yaml
    python -m seo_agents.run --config config/seo.yaml --dry-run
"""

__version__ = "1.0.0"
__author__ = "Ayonne"

from .orchestrator import SEOCommander
from .run import main

__all__ = ["SEOCommander", "main", "__version__"]
