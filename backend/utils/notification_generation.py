from uuid import UUID
from sqlalchemy.orm import Session
from models.notifications import Notification
from dotenv import load_dotenv
import os

load_dotenv()
FRONTEND_URL = os.getenv("FRONTEND_URL")


def create_notification(
    db: Session,
    user_id: UUID,
    type: str,
    message: str,
    target_id: str | None = None,
    token: str | None = None,
    project_id: str | None = None,
):
    link = None

    if type == "workspace_invite" and target_id and token:
        # Full URL with workspaceId & token
        link = f"{FRONTEND_URL}/workspace/invite-user?workspaceId={target_id}&token={token}"
    elif type == "workspace" and target_id:
        link = f"{FRONTEND_URL}/workspaces/{target_id}"
    elif type == "project" and target_id and project_id:
        link = f"{FRONTEND_URL}/workspaces/{target_id}/projects/{project_id}"
    else:
        # fallback: just homepage
        link = FRONTEND_URL

    notif = Notification(
        user_id=user_id,
        type=type,
        message=message,
        link=link,
    )

    db.add(notif)
    return notif
