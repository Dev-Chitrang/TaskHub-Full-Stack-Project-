from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from database import Base
from datetime import datetime

class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(String, nullable=False)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    mentions = Column(JSON, nullable=True)  # [{user: uuid, offset: int, length: int}]
    reactions = Column(JSON, nullable=True)  # [{emoji: str, user: uuid}]
    attachments = Column(JSON, nullable=True)  # [{fileName, fileUrl, fileType, fileSize}]
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    task = relationship("Task", back_populates="comments")
    author = relationship("User")
