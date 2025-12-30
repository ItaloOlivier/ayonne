"""
Base Agent

Abstract base class for all SEO agents.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class TaskPriority(Enum):
    """Task priority levels."""
    CRITICAL = 100
    HIGH = 75
    MEDIUM = 50
    LOW = 25
    INFORMATIONAL = 10


class TaskRisk(Enum):
    """Task risk levels."""
    HIGH = 75
    MEDIUM = 50
    LOW = 25
    MINIMAL = 10


@dataclass
class Task:
    """A task to be executed."""
    id: str
    agent: str
    description: str
    priority: int = 50
    risk: int = 25
    action_type: str = "report"  # report, modify, create, delete
    target_file: Optional[str] = None
    target_url: Optional[str] = None
    changes: Optional[Dict] = None
    metadata: Dict = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    executed: bool = False
    execution_result: Optional[str] = None

    @property
    def score(self) -> float:
        """Calculate task score (higher priority, lower risk = higher score)."""
        return (self.priority * 0.6) + ((100 - self.risk) * 0.4)

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'agent': self.agent,
            'description': self.description,
            'priority': self.priority,
            'risk': self.risk,
            'score': self.score,
            'action_type': self.action_type,
            'target_file': self.target_file,
            'target_url': self.target_url,
            'changes': self.changes,
            'metadata': self.metadata,
            'created_at': self.created_at,
            'executed': self.executed,
            'execution_result': self.execution_result
        }


@dataclass
class AgentResult:
    """Result from an agent's analysis."""
    agent_name: str
    success: bool
    tasks: List[Task] = field(default_factory=list)
    metrics: Dict = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    summary: str = ""
    execution_time: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            'agent_name': self.agent_name,
            'success': self.success,
            'tasks': [t.to_dict() for t in self.tasks],
            'metrics': self.metrics,
            'errors': self.errors,
            'warnings': self.warnings,
            'summary': self.summary,
            'execution_time': self.execution_time,
            'timestamp': self.timestamp
        }


class BaseAgent(ABC):
    """
    Abstract base class for SEO agents.

    All agents must implement:
    - analyze(): Run analysis and return results
    - get_kpis(): Return agent's KPIs
    """

    def __init__(self, config: Dict, logger: Optional[logging.Logger] = None):
        """
        Initialize agent.

        Args:
            config: Configuration dictionary
            logger: Optional logger instance
        """
        self.config = config
        self.logger = logger or logging.getLogger(self.__class__.__name__)
        self.name = self.__class__.__name__
        self._task_counter = 0

    @abstractmethod
    def analyze(self, crawl_data: Dict, **kwargs) -> AgentResult:
        """
        Run analysis and return results.

        Args:
            crawl_data: Dictionary of crawled page data
            **kwargs: Additional arguments

        Returns:
            AgentResult with findings and tasks
        """
        pass

    @abstractmethod
    def get_kpis(self) -> Dict[str, Any]:
        """
        Return agent's KPIs.

        Returns:
            Dictionary of KPI names to values
        """
        pass

    def create_task(
        self,
        description: str,
        priority: int = TaskPriority.MEDIUM.value,
        risk: int = TaskRisk.LOW.value,
        action_type: str = "report",
        target_file: Optional[str] = None,
        target_url: Optional[str] = None,
        changes: Optional[Dict] = None,
        metadata: Optional[Dict] = None
    ) -> Task:
        """
        Create a new task.

        Args:
            description: Human-readable task description
            priority: Priority score (0-100)
            risk: Risk score (0-100)
            action_type: Type of action (report, modify, create, delete)
            target_file: File to modify (if applicable)
            target_url: URL this task relates to
            changes: Specific changes to make
            metadata: Additional metadata

        Returns:
            Task instance
        """
        self._task_counter += 1
        task_id = f"{self.name}_{self._task_counter}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        return Task(
            id=task_id,
            agent=self.name,
            description=description,
            priority=priority,
            risk=risk,
            action_type=action_type,
            target_file=target_file,
            target_url=target_url,
            changes=changes or {},
            metadata=metadata or {}
        )

    def log_info(self, message: str) -> None:
        """Log info message."""
        self.logger.info(f"[{self.name}] {message}")

    def log_warning(self, message: str) -> None:
        """Log warning message."""
        self.logger.warning(f"[{self.name}] {message}")

    def log_error(self, message: str) -> None:
        """Log error message."""
        self.logger.error(f"[{self.name}] {message}")

    def get_config(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        keys = key.split('.')
        value = self.config
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k, default)
            else:
                return default
        return value

    def validate_risk(self, task: Task) -> bool:
        """
        Validate task risk is acceptable.

        Returns True if task can proceed.
        """
        max_risk = self.get_config('limits.max_auto_risk', 70)

        if task.risk > max_risk:
            self.log_warning(
                f"Task '{task.id}' has high risk ({task.risk}), "
                f"requires manual review"
            )
            return False

        return True
