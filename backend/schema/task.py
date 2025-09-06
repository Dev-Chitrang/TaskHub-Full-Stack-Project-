from uuid import UUID
from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from typing import Optional, List
from uuid import UUID


class TaskResponse(BaseModel):
    id: UUID
    title: str
    status: str

    class Config:
        from_attributes = True


# -------------------------------
# ENUMS
# -------------------------------
class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    review = "review"
    done = "done"


class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


# -------------------------------
# NESTED OBJECTS
# -------------------------------
class SubtaskResponse(BaseModel):
    id: str
    title: str
    completed: bool = False
    created_at: datetime


class AttachmentResponse(BaseModel):
    file_name: str
    file_url: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_by: Optional[UUID] = None
    uploaded_at: datetime


class UserLiteResponse(BaseModel):
    id: UUID
    name: Optional[str] = None
    profile_picture: Optional[str] = None

    model_config = {"from_attributes": True}


# -------------------------------
# MAIN TASK RESPONSE
# -------------------------------
class TaskBaseResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    project_id: UUID
    status: TaskStatus
    priority: TaskPriority
    watchers: List[UUID] = []
    tags: List[str] = []
    subtasks: List[SubtaskResponse] = []
    attachments: List[AttachmentResponse] = []
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_hours: int = 0
    actual_hours: int = 0
    created_by: UUID
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    assignees: List[
        UserLiteResponse
    ] = []  # Like populate("assignees", "name profilePicture")

    model_config = {"from_attributes": True}
