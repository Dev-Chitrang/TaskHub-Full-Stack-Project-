from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Enum, Integer, JSON, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from database import Base
import enum
from  datetime import datetime

# Association table for many-to-many relationship between tasks and users
task_assignees = Table(
    "task_assignees",
    Base.metadata,
    Column("task_id", UUID(as_uuid=True), ForeignKey("tasks.id"), primary_key=True),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
)

class TaskStatus(enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    review = "review"
    done = "done"

class TaskPriority(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.todo)
    priority = Column(Enum(TaskPriority), default=TaskPriority.medium)
    watchers = Column(JSON, default=[])   # List of UUIDs
    tags = Column(JSON, default=[])       # List of strings
    subtasks = Column(JSON, default=[])   # List of dicts {title, completed, createdAt}
    attachments = Column(JSON, default=[]) # List of dicts {fileName, fileUrl, fileType, fileSize, uploadedBy, uploadedAt}
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    estimated_hours = Column(Integer, default=0)
    actual_hours = Column(Integer, default=0)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")
    comments = relationship("Comment", back_populates="task")
    assignees = relationship("User", secondary=task_assignees, back_populates="tasks_assigned")
    created_by_user = relationship("User", foreign_keys=[created_by], back_populates="tasks_created")
