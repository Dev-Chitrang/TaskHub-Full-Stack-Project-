from pydantic import BaseModel, constr
from typing import Annotated, List
from typing import Optional
from uuid import UUID
from datetime import datetime
from .project import ProjectResponse
from .user import UserSchemaOut

NameStr = Annotated[str, constr(strip_whitespace=True, min_length=3)]
color = Annotated[str, constr(strip_whitespace=True,min_length=3)]

class WorkSpaceSchema(BaseModel):
    name: NameStr
    description: str
    color: color

class WorkspaceMembersSchemaOut(BaseModel):
    id: UUID
    user_id: UUID
    role: str
    joined_at: datetime
    user: UserSchemaOut

    class Config:
        from_attributes = True

class WorkSpaceSchemaOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    color: str
    owner_id: UUID
    created_at: datetime
    members: List[WorkspaceMembersSchemaOut] = []
    projects: List[ProjectResponse] = []

    class Config:
        from_attributes = True
