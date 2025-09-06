from fastapi import APIRouter
from . import auth
from . import workspace
from . import project
from . import task
from . import user
from . import notifications

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Auth"])
router.include_router(workspace.router, prefix="/workspaces", tags=["Workspace"])
router.include_router(project.router, prefix="/projects", tags=["Project"])
router.include_router(task.router, prefix="/tasks", tags=["Task"])
router.include_router(user.router, prefix="/users", tags=["User"])
router.include_router(
    notifications.router, prefix="/notifications", tags=["Notifications"]
)
