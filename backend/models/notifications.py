from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    type = Column(
        String, nullable=False
    )  # "workspace_invite", "project_add", "task_assigned"
    message = Column(String, nullable=False)  # human-readable
    link = Column(
        String, nullable=True
    )  # frontend link (/workspaces/{id}, /projects/{id}, etc.)

    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relation
    user = relationship("User", back_populates="notifications")

