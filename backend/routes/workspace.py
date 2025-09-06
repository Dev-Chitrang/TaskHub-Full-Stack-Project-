from fastapi import APIRouter, status, Depends, Request
from database import get_db
from sqlalchemy.orm import Session, joinedload
from schema.workspace import WorkSpaceSchema, WorkSpaceSchemaOut
from middleware.auth_middleware import get_current_user
from models import User, Workspace, WorkspaceMember, Project, Task, WorkspaceInvite
from models.projects import ProjectMember, ProjectStatus
from models.tasks import TaskStatus, TaskPriority
from models.workspace import WorkspaceRole
from fastapi.responses import ORJSONResponse
from datetime import datetime, timedelta
from typing import List
from uuid import UUID
import jwt
from dotenv import load_dotenv
import os
import mailer
from models.notifications import Notification
from utils.notification_generation import create_notification

load_dotenv()


router = APIRouter()


@router.post("/", response_model=WorkSpaceSchemaOut)
def createWorkspace(
    request: Request,
    payload: WorkSpaceSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        name, description, color = payload.name, payload.description, payload.color

        workspace = Workspace(
            name=name,
            description=description,
            color=color,
            owner_id=current_user.id,
            created_at=datetime.utcnow(),
        )
        members = WorkspaceMember(
            workspace=workspace,
            user_id=current_user.id,
            role=WorkspaceRole.owner,
            joined_at=datetime.utcnow(),
        )
        db.add(workspace)
        db.add(members)
        db.commit()
        db.refresh(workspace)
        db.refresh(members)

    except Exception as e:
        db.rollback()
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )

    return workspace


@router.get("/", response_model=List[WorkSpaceSchemaOut])
def getWorkspaces(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workspaces = (
            db.query(Workspace)
            .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
            .filter(WorkspaceMember.user_id == current_user.id)
            .options(
                joinedload(Workspace.members).joinedload(WorkspaceMember.user),
                joinedload(Workspace.projects),
            )
            .all()
        )
        return workspaces

    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.get("/{workspace_id}", response_model=WorkSpaceSchemaOut)
def getWorkspaceDetails(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workspace = (
            db.query(Workspace)
            .options(joinedload(Workspace.members).joinedload(WorkspaceMember.user))
            .options(joinedload(Workspace.projects).joinedload(Project.tasks))
            .filter(Workspace.id == workspace_id)
            .first()
        )

        if not workspace:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Workspace not found"},
            )
        isMember = any(m.user_id == current_user.id for m in workspace.members)
        if not isMember:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not a member of this workspace"},
            )

        return workspace

    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.get("/{workspace_id}/projects")
def getWorkspaceProjects(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workspace = (
            db.query(Workspace)
            .join(WorkspaceMember)
            .filter(
                Workspace.id == workspace_id, WorkspaceMember.user_id == current_user.id
            )
            .options(
                joinedload(Workspace.members).joinedload(
                    WorkspaceMember.user
                )  # ✅ like populate
            )
            .first()
        )

        if not workspace:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Workspace not found"},
            )

        projects = (
            db.query(Project)
            .join(ProjectMember)
            .filter(
                Project.workspace_id == workspace_id,
                ProjectMember.user_id == current_user.id,
                Project.is_archived == False,
            )
            .options(
                joinedload(Project.tasks),
                joinedload(Project.members).joinedload(ProjectMember.user),
            )
            .order_by(Project.created_at.desc())
            .all()
        )

        return {"workspace": workspace, "projects": projects}

    except Exception as e:
        print(str(e))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.get("/{workspace_id}/stats")
def get_workspace_stats(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # --- Validate workspace ---
        if workspace_id is None:
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Workspace ID is required"},
            )

        workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not workspace:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Workspace not found"},
            )

        # Membership check
        if not any(m.user_id == current_user.id for m in workspace.members):
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not a member of this workspace"},
            )

        # --- Fetch projects & tasks ---
        projects = (
            db.query(Project)
            .filter(Project.workspace_id == workspace_id)
            .order_by(Project.created_at.desc())
            .all()
        )
        total_projects = len(projects)
        total_archived_projects = sum(1 for p in projects if p.is_archived)

        tasks = (
            db.query(Task)
            .join(Project)
            .filter(Project.workspace_id == workspace_id)
            .all()
        )
        total_tasks = len(tasks)

        # --- Project & Task Stats ---
        total_project_in_progress = sum(
            1
            for p in projects
            if p.status == ProjectStatus.in_progress and not p.is_archived
        )
        total_task_completed = sum(
            1 for t in tasks if t.status == TaskStatus.done and not t.is_archived
        )
        total_task_todo = sum(
            1 for t in tasks if t.status == TaskStatus.todo and not t.is_archived
        )
        total_task_in_progress = sum(
            1 for t in tasks if t.status == TaskStatus.in_progress and not t.is_archived
        )

        # --- Helper to normalize values to date ---
        # Accepts: datetime, date, or ISO date/datetime string. Returns date or None.
        from datetime import datetime as _dt_cls, date as _date_cls

        def _to_date(val):
            if val is None:
                return None
            # already a datetime.datetime
            if isinstance(val, _dt_cls):
                return val.date()
            # already a datetime.date
            if isinstance(val, _date_cls):
                return val
            # try parsing ISO string (e.g. "2025-09-03" or "2025-09-03T12:34:56")
            try:
                parsed = _dt_cls.fromisoformat(str(val))
                return parsed.date()
            except Exception:
                # fallback: can't parse
                return None

        # --- Upcoming tasks (7-day window) ---
        from datetime import datetime as _now_dt, timedelta as _td

        now_dt = _now_dt.utcnow()
        today_date = _to_date(now_dt)
        upcoming_limit_date = _to_date(now_dt + _td(days=7))

        upcoming_tasks = []
        for t in tasks:
            if t.is_archived:
                continue
            t_due_date = _to_date(t.due_date)
            if not t_due_date:
                continue
            # safe date comparison
            if today_date < t_due_date <= upcoming_limit_date:
                upcoming_tasks.append(
                    {
                        "id": str(t.id),
                        "title": t.title,
                        "status": t.status.value
                        if isinstance(t.status, TaskStatus)
                        else t.status,
                        "priority": t.priority.value
                        if isinstance(t.priority, TaskPriority)
                        else t.priority,
                        "due_date": t_due_date,
                        "created_at": t.created_at,
                        "updated_at": t.updated_at,
                        "project_id": str(t.project_id),
                    }
                )

        # --- Weekly task trend (last 7 days) ---
        task_trends_data = [
            {"name": "Sun", "completed": 0, "inProgress": 0, "toDo": 0, "archived": 0},
            {"name": "Mon", "completed": 0, "inProgress": 0, "toDo": 0, "archived": 0},
            {"name": "Tue", "completed": 0, "inProgress": 0, "toDo": 0, "archived": 0},
            {"name": "Wed", "completed": 0, "inProgress": 0, "toDo": 0, "archived": 0},
            {"name": "Thu", "completed": 0, "inProgress": 0, "toDo": 0, "archived": 0},
            {"name": "Fri", "completed": 0, "inProgress": 0, "toDo": 0, "archived": 0},
            {"name": "Sat", "completed": 0, "inProgress": 0, "toDo": 0, "archived": 0},
        ]
        last_7_days = [(now_dt - _td(days=i)).date() for i in range(6, -1, -1)]

        for task in tasks:
            if not task.updated_at:
                continue
            task_date = _to_date(task.updated_at)
            if not task_date:
                continue
            if task_date in last_7_days:
                day_name = task_date.strftime("%a")
                day_data = next(
                    (d for d in task_trends_data if d["name"] == day_name), None
                )
                if day_data is not None:
                    if task.is_archived:
                        day_data["archived"] += 1
                    elif task.status == TaskStatus.done:
                        day_data["completed"] += 1
                    elif task.status == TaskStatus.in_progress:
                        day_data["inProgress"] += 1
                    elif task.status == TaskStatus.todo:
                        day_data["toDo"] += 1

        # --- Project status summary ---
        project_status_data = [
            {"name": "completed", "value": 0, "color": "#10b981"},
            {"name": "inProgress", "value": 0, "color": "#f59e0b"},
            {"name": "planning", "value": 0, "color": "#3b82f6"},
            {"name": "archived", "value": 0, "color": "#6b7280"},
        ]
        for p in projects:
            if p.is_archived:
                project_status_data[3]["value"] += 1
            elif p.status == ProjectStatus.completed:
                project_status_data[0]["value"] += 1
            elif p.status == ProjectStatus.in_progress:
                project_status_data[1]["value"] += 1
            elif p.status == ProjectStatus.planning:
                project_status_data[2]["value"] += 1

        # --- Task priority summary ---
        task_priority_data = [
            {"name": "high", "value": 0, "color": "#ef4444"},
            {"name": "medium", "value": 0, "color": "#f59e0b"},
            {"name": "low", "value": 0, "color": "#10b981"},
            {"name": "archived", "value": 0, "color": "#6b7280"},
        ]
        for t in tasks:
            if t.is_archived:
                task_priority_data[3]["value"] += 1
            elif t.priority == TaskPriority.high:
                task_priority_data[0]["value"] += 1
            elif t.priority == TaskPriority.medium:
                task_priority_data[1]["value"] += 1
            elif t.priority == TaskPriority.low:
                task_priority_data[2]["value"] += 1

        # --- Productivity by project ---

        # --- Stats summary ---
        stats = {
            "totalProjects": total_projects,
            "totalArchivedProjects": total_archived_projects,
            "totalTasks": total_tasks,
            "totalProjectInProgress": total_project_in_progress,
            "totalTaskCompleted": total_task_completed,
            "totalTaskToDo": total_task_todo,
            "totalTaskInProgress": total_task_in_progress,
        }

        # --- Recent projects (archived + unarchived) ---
        recent_projects = []
        for p in projects[:5]:
            project_tasks = [t for t in tasks if t.project_id == p.id]
            recent_projects.append(
                {
                    "id": str(p.id),
                    "workspace_id": str(p.workspace_id),
                    "title": p.title,
                    "description": p.description,
                    "status": p.status.value
                    if isinstance(p.status, ProjectStatus)
                    else p.status,
                    "start_date": p.start_date,
                    "due_date": p.due_date,
                    "created_at": p.created_at,
                    "updated_at": p.updated_at,
                    "tags": p.tags,
                    "is_archived": p.is_archived,
                    "progress": p.progress,
                    "tasks": [
                        {
                            "id": str(t.id),
                            "title": t.title,
                            "status": t.status.value
                            if isinstance(t.status, TaskStatus)
                            else t.status,
                            "priority": t.priority.value
                            if isinstance(t.priority, TaskPriority)
                            else t.priority,
                            "is_archived": t.is_archived,
                            "due_date": t.due_date,
                            "created_at": t.created_at,
                            "updated_at": t.updated_at,
                        }
                        for t in project_tasks
                    ],
                }
            )

        return {
            "stats": stats,
            "taskTrendsData": task_trends_data,
            "projectStatusData": project_status_data,
            "taskPriorityData": task_priority_data,
            "upcomingTasks": upcoming_tasks,
            "recentProjects": recent_projects,
        }

    except Exception as e:
        print(str(e))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.post("/{workspace_id}/invite-member")
def invite_user_to_workspace(
    workspace_id: UUID,
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        email = payload.get("email")
        role = payload.get("role", WorkspaceRole.member)

        workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not workspace:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Workspace not found"},
            )

        membership_info = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == current_user.id,
            )
            .first()
        )
        if not membership_info or membership_info.role not in [
            WorkspaceRole.owner,
            WorkspaceRole.admin,
        ]:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "message": "You are not authorized to invite members to this workspace."
                },
            )

        user = db.query(User).filter(User.email == email).first()
        if not user:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "User not found"},
            )

        existing_membership = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user.id,
            )
            .first()
        )
        if existing_membership:
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "User already a member of workspace"},
            )

        existing_invite = (
            db.query(WorkspaceInvite)
            .filter(
                WorkspaceInvite.workspace_id == workspace_id,
                WorkspaceInvite.user_id == user.id,
            )
            .first()
        )
        if existing_invite and existing_invite.expires_at > datetime.utcnow():
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "User already invited to workspace"},
            )
        if existing_invite and existing_invite.expires_at < datetime.utcnow():
            db.delete(existing_invite)

        role_value = role.value if isinstance(role, WorkspaceRole) else role
        if role_value not in [r.value for r in WorkspaceRole]:
            role_value = WorkspaceRole.member.value

        invite_token = jwt.encode(
            {
                "userId": str(user.id),
                "workspaceId": str(workspace_id),
                "role": role_value,
                "exp": datetime.utcnow() + timedelta(days=7),
            },
            os.getenv("JWT_SECRET"),
            algorithm=os.getenv("ALGORITHM"),
        )

        new_invite = WorkspaceInvite(
            workspace_id=workspace_id,
            user_id=user.id,
            role=role_value,
            token=invite_token,
            expires_at=datetime.utcnow() + timedelta(days=7),
            created_at=datetime.utcnow(),
        )

        db.add(new_invite)

        create_notification(
            db=db,
            user_id=user.id,
            type="workspace_invite",
            message=f"You have been invited to join {workspace.name} by {current_user.name}",
            target_id=str(workspace_id),
            token=invite_token,
        )

        mailer.generate_email(
            token=invite_token,
            to=user.email,
            purpose="invite-user",
            workspace_id=str(workspace_id),
            workspace_name=workspace.name,
            workspaceColor=workspace.color,
        )

        db.commit()

        return ORJSONResponse(
            status_code=status.HTTP_200_OK, content={"message": "Invitation sent"}
        )
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.post("/{workspace_id}/accept-invite")
def accept_generated_invitation(
    workspace_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not workspace:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Workspace not found"},
            )

        is_member = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == current_user.id,
            )
            .first()
        )
        if is_member:
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "You are already a member of this workspace"},
            )

        new_member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=current_user.id,
            role=WorkspaceRole.member,
            joined_at=datetime.utcnow(),
        )
        db.add(new_member)

        create_notification(
            db=db,
            user_id=current_user.id,
            type="workspace",
            message=f"You have joined {workspace.name}",
            target_id=str(workspace_id),
        )

        db.commit()
        db.refresh(new_member)

        return ORJSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Invitation accepted successfully"},
        )
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.post("/accept-invite-token")
def accept_invite_by_token(
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        token = payload["token"]
        decoded = jwt.decode(
            token, os.getenv("JWT_SECRET"), algorithms=[os.getenv("ALGORITHM")]
        )
        invited_user_id = decoded["userId"]
        workspace_id = decoded["workspaceId"]
        role = decoded.get("role", WorkspaceRole.member)

        workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not workspace:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Workspace not found"},
            )

        if str(current_user.id) != str(invited_user_id):
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "This invitation does not belong to you"},
            )

        is_member = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == current_user.id,
            )
            .first()
        )
        if is_member:
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "You are already a member of this workspace"},
            )

        invite_info = (
            db.query(WorkspaceInvite)
            .filter(
                WorkspaceInvite.user_id == invited_user_id,
                WorkspaceInvite.workspace_id == workspace_id,
            )
            .first()
        )
        if not invite_info:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Invitation not found"},
            )
        if invite_info.expires_at < datetime.utcnow():
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Invitation has expired"},
            )

        new_member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=current_user.id,
            role=role,
            joined_at=datetime.utcnow(),
        )
        db.add(new_member)

        create_notification(
            db=db,
            user_id=current_user.id,
            type="workspace",
            message=f"You have been added to workspace '{workspace.name}'",
            target_id=str(workspace.id),
        )

        inviter = db.query(User).filter(User.id == workspace.owner_id).first()
        if inviter:
            create_notification(
                db=db,
                user_id=inviter.id,
                type="workspace",
                message=f"{current_user.name} has accepted your invitation and joined workspace '{workspace.name}'",
                target_id=str(workspace_id),
            )

        db.delete(invite_info)
        db.commit()
        db.refresh(new_member)

        return ORJSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Invitation accepted successfully",
                "workspaceId": str(workspace_id),
            },
        )
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.put("/{workspace_id}/members/{user_id}")
def toggle_workspace_member(
    workspace_id: UUID,
    user_id: UUID,
    request: Request,
    payload: dict = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not workspace:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Workspace not found"},
            )
        if workspace.owner_id != current_user.id:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not the owner of this workspace"},
            )

        role = payload.get("role") if payload else None

        member = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
            )
            .first()
        )

        if member:
            if role is None:
                project_memberships = (
                    db.query(ProjectMember)
                    .join(Project, Project.id == ProjectMember.project_id)
                    .filter(
                        Project.workspace_id == workspace_id,
                        ProjectMember.user_id == user_id,
                    )
                    .all()
                )

                if project_memberships:
                    return ORJSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={
                            "message": "Cannot remove member. They are part of a project in this workspace."
                        },
                    )

                db.delete(member)
                create_notification(
                    db,
                    user_id,
                    type="workspace",
                    message=f"You have been removed from workspace '{workspace.name}'",
                    target_id=str(workspace_id),
                )
                action = "removed"
            else:
                member.role = role
                create_notification(
                    db,
                    user_id,
                    type="workspace",
                    message=f"Your role was updated in workspace '{workspace.name}'",
                    target_id=str(workspace_id),
                )
                action = "updated"

            db.commit()
            db.refresh(workspace)

            return {
                "message": f"Workspace member {action} successfully",
                "workspace": WorkSpaceSchemaOut.model_validate(
                    workspace, from_attributes=True
                ),
            }

        return ORJSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": "Member not found"},
        )

    except Exception as e:
        print(str(e))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )
