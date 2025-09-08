from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from enum import Enum
from typing import Optional, List
from .task import TaskResponse
from models.projects import Role


class ProjectStatus(Enum):
    planning = "planning"
    in_progress = "in_progress"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"


class MemberResponse(BaseModel):
    user_id: UUID
    role: Role
    name: str
    profilePicture: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.planning
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = []
    members: Optional[List[MemberResponse]] = []


class ProjectResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    title: str
    description: Optional[str]
    status: str
    start_date: Optional[datetime]
    due_date: Optional[datetime]
    progress: int
    created_by: UUID
    is_archived: bool
    members: List[MemberResponse] = []
    tasks: List[TaskResponse] = []

    class Config:
        from_attributes = True
