from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Boolean,
    Enum,
    Integer,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid, enum
from datetime import datetime
from database import Base
from sqlalchemy.ext.hybrid import hybrid_property


class ProjectStatus(enum.Enum):
    planning = "planning"
    in_progress = "in_progress"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"


class Role(enum.Enum):
    manager = "manager"
    contributor = "contributor"
    viewer = "viewer"


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    workspace_id = Column(
        UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False
    )
    status = Column(Enum(ProjectStatus), default=ProjectStatus.planning)
    start_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    progress = Column(Integer, default=0)
    tags = Column(JSON, default=[])  # List of strings
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="projects")
    tasks = relationship("Task", back_populates="project")
    members = relationship("ProjectMember", back_populates="project")
    created_by_user = relationship("User", back_populates="projects_created")


class ProjectMember(Base):
    __tablename__ = "project_members"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    role = Column(Enum(Role), default=Role.contributor)

    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_members")

    @hybrid_property
    def name(self):
        return self.user.name if self.user else None

    @hybrid_property
    def profilePicture(self):
        return self.user.profilePicture if self.user else None
