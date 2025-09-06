from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    profilePicture = Column(String, nullable=True)
    isEmailVerified = Column(Boolean, default=False)
    lastLogin = Column(DateTime, nullable=True)
    is2FAEnabled = Column(Boolean, default=False)
    twoFAOtp = Column(String, nullable=True)
    twoFAOtpExpires = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspaces_owned = relationship("Workspace", back_populates="owner")
    workspace_memberships = relationship("WorkspaceMember", back_populates="user")
    project_members = relationship("ProjectMember", back_populates="user")
    projects_created = relationship("Project", back_populates="created_by_user")
    tasks_assigned = relationship("Task", secondary="task_assignees", back_populates="assignees")
    tasks_created = relationship("Task", foreign_keys="Task.created_by", back_populates="created_by_user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
