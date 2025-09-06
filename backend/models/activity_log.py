from sqlalchemy import Column, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
import enum
from sqlalchemy import JSON, DateTime
from datetime import datetime


class ActionType(enum.Enum):
    created_task = "created_task"
    updated_task = "updated_task"
    created_subtask = "created_subtask"
    updated_subtask = "updated_subtask"
    completed_task = "completed_task"
    added_comment = "added_comment"
    added_member = "added_member"
    removed_member = "removed_member"
    added_attachment = "added_attachment"
    removed_attachment = "removed_attachment"


class ResourceType(enum.Enum):
    task = "Task"
    project = "Project"
    workspace = "Workspace"
    comment = "Comment"
    user = "User"


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(Enum(ActionType), nullable=False)
    resource_type = Column(Enum(ResourceType), nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
