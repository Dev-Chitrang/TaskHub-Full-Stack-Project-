from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class UserSchemaOut(BaseModel):
    id: UUID
    name: str
    email: str
    profilePicture: Optional[str] = None
    is2FAEnabled: Optional[bool] = False

    class Config:
        from_attributes = True
