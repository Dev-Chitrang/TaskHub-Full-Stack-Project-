from fastapi import APIRouter, status, Depends
from fastapi.responses import ORJSONResponse
from database import get_db
from middleware.auth_middleware import get_current_user
from schema.project import ProjectBase
from sqlalchemy.orm import Session
from sqlalchemy import select
from models import User
from uuid import UUID
from models import Workspace, WorkspaceMember, Project
from models.projects import ProjectMember, Role, ProjectStatus
from models.notifications import Notification
from schema.project import ProjectResponse
from schema.task import TaskBaseResponse, TaskStatus
from models import Task
from utils.notification_generation import create_notification

router = APIRouter()


@router.post("/{workspace_id}/create-project")
def createProject(
    payload: ProjectBase,
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        title, description, Projectstatus, start_date, due_date, tags, members = (
            payload.title,
            payload.description,
            payload.status,
            payload.start_date,
            payload.due_date,
            payload.tags,
            payload.members,
        )

        # check workspace
        workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not workspace:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Workspace not found"},
            )

        # check membership
        isMember = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == current_user.id,
            )
            .first()
        )
        if not isMember:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not a member of this workspace"},
            )

        # create project
        newProject = Project(
            title=title,
            description=description,
            workspace_id=workspace_id,
            status=Projectstatus.value
            if hasattr(Projectstatus, "value")
            else Projectstatus,
            start_date=start_date,
            due_date=due_date,
            tags=tags,
            created_by=current_user.id,
        )

        db.add(newProject)
        db.flush()  # ✅ ensure newProject.id is available

        # add project members
        for member in members or []:
            projectMember = ProjectMember(
                project_id=newProject.id, user_id=member.user_id, role=member.role
            )
            db.add(
                Notification(
                    user_id=member.user_id,
                    message=f"You have been invited to join the project {newProject.title}",
                    type="project_add",
                    link=f"/workspaces/{workspace_id}/projects/{newProject.id}",
                )
            )
            db.add(projectMember)

        db.commit()
        db.refresh(newProject)

        return ORJSONResponse(
            status_code=201,
            content={
                "message": "Project created successfully",
                "project": ProjectResponse.model_validate(newProject).dict(
                    by_alias=True
                ),
            },
        )

    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.get("/achievements")
def getAchievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        completed_projects = (
            db.query(Project)
            .join(ProjectMember)
            .filter(
                Project.status == ProjectStatus.completed,
                ProjectMember.user_id == current_user.id,
                Project.is_archived.is_(False),
            )
            .all()
        )
        completed_tasks = (
            db.query(Task)
            .filter(
                Task.status == TaskStatus.done,
                Task.assignees.any(id=current_user.id),
                Task.is_archived.is_(False),
            )
            .all()
        )
        return {
            "projects": [
                {
                    "id": str(p.id),
                    "title": p.title,
                    "description": p.description,
                    "completed_at": p.updated_at,
                    "workspace_id": str(p.workspace_id),
                    "workspace_name": p.workspace.name,
                    "workspace_color": p.workspace.color,
                }
                for p in completed_projects
            ],
            "tasks": [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "project_id": t.project_id,
                    "project": t.project.title if t.project else None,
                    "workspace": t.project.workspace.name if t.project else None,
                    "workspace_color": t.project.workspace.color if t.project else None,
                    "completed_at": t.updated_at,
                    "workspace_id": str(t.project.workspace_id) if t.project else None,
                }
                for t in completed_tasks
            ],
        }
    except Exception as e:
        print(str(e))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.get("/{project_id}")
def getProjectDetails(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = db.execute(select(Project).where(Project.id == project_id))
        project = result.scalars().first()

        if not project:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Project not found"},
            )

        isMember = any(m.user_id == current_user.id for m in project.members)
        if not isMember:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not a member of this project"},
            )
        return ProjectResponse.from_orm(project)

    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.get("/{project_id}/tasks")
def getProjectTasks(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = db.execute(select(Project).where(Project.id == project_id))
        project = result.scalars().first()
        if not project:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Project not found"},
            )
        isMember = any(m.user_id == current_user.id for m in project.members)
        if not isMember:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not a member of this project"},
            )
        result = db.execute(
            select(Task)
            .where(Task.project_id == project_id)
            .order_by(Task.created_at.desc())
        )
        tasks = result.scalars().all()
        return {
            "project": ProjectResponse.from_orm(project),
            "tasks": [TaskBaseResponse.from_orm(task) for task in tasks],
        }
    except Exception as e:
        print(str(e))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.put("/{project_id}/archive")
def archiveProject(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return ORJSONResponse(
                status_code=404, content={"message": "Project not found"}
            )

        isManager = any(
            m.user_id == current_user.id and m.role == Role.manager
            for m in project.members
        )
        if not isManager:
            return ORJSONResponse(
                status_code=403,
                content={"message": "You are not authorized to archive this project"},
            )

        was_archived = project.is_archived
        project.is_archived = not was_archived

        # Notify all members
        for m in project.members:
            create_notification(
                db,
                m.user_id,
                type="project_archived",
                message=f"Project '{project.title}' was {'archived' if not was_archived else 'unarchived'}",
                target_id=str(project.workspace_id),
                project_id=str(project.id),
            )

        db.commit()
        db.refresh(project)
        return ProjectResponse.model_validate(project, from_attributes=True)

    except Exception as e:
        db.rollback()
        return ORJSONResponse(status_code=500, content={"message": str(e)})


@router.put("/{project_id}/status-change")
def changeStatus(
    project_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return ORJSONResponse(
                status_code=404, content={"message": "Project not found"}
            )

        isManager = any(
            m.user_id == current_user.id and m.role == Role.manager
            for m in project.members
        )
        if not isManager:
            return ORJSONResponse(
                status_code=403,
                content={"message": "You are not authorized to change project status"},
            )

        if project.is_archived:
            return ORJSONResponse(
                status_code=400,
                content={
                    "message": "You cannot change the status of an archived project"
                },
            )

        if payload["status"] == ProjectStatus.completed.value:
            incomplete_tasks = (
                db.query(Task)
                .filter(Task.project_id == project_id)
                .filter(Task.status != TaskStatus.done)
                .all()
            )
            if incomplete_tasks:
                return ORJSONResponse(
                    status_code=400,
                    content={
                        "message": "All tasks must be completed before changing the status"
                    },
                )

        old_status = project.status
        project.status = ProjectStatus(payload["status"])

        for m in project.members:
            create_notification(
                db,
                m.user_id,
                type="project_status",
                message=f"Project '{project.title}' status changed from {old_status.value} to {project.status.value}",
                target_id=str(project.workspace_id),
                project_id=str(project.id),
            )

        db.commit()
        db.refresh(project)
        return ProjectResponse.model_validate(project, from_attributes=True)

    except Exception as e:
        db.rollback()
        return ORJSONResponse(status_code=500, content={"message": str(e)})


@router.put("/{project_id}/title")
def updateTitle(
    project_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return ORJSONResponse(
                status_code=404, content={"message": "Project not found"}
            )

        isManager = any(
            m.user_id == current_user.id and m.role == Role.manager
            for m in project.members
        )
        if not isManager:
            return ORJSONResponse(
                status_code=403,
                content={"message": "You are not authorized to change project title"},
            )

        new_title = payload.get("title")
        if not new_title:
            return ORJSONResponse(
                status_code=400, content={"message": "Title is required"}
            )

        old_title = project.title
        project.title = new_title

        for m in project.members:
            create_notification(
                db,
                m.user_id,
                type="project_title",
                message=f"Project title changed from '{old_title}' to '{new_title}'",
                target_id=str(project.workspace_id),
                project_id=str(project.id),
            )

        db.commit()
        db.refresh(project)
        return ProjectResponse.model_validate(project, from_attributes=True)

    except Exception as e:
        db.rollback()
        return ORJSONResponse(status_code=500, content={"message": str(e)})


@router.put("/{project_id}/description")
def updateDescription(
    project_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return ORJSONResponse(
                status_code=404, content={"message": "Project not found"}
            )

        isManager = any(
            m.user_id == current_user.id and m.role == Role.manager
            for m in project.members
        )
        if not isManager:
            return ORJSONResponse(
                status_code=403,
                content={
                    "message": "You are not authorized to change project description"
                },
            )

        project.description = payload.get("description", project.description)

        for m in project.members:
            create_notification(
                db,
                m.user_id,
                type="project_description",
                message=f"Project '{project.title}' description was updated.",
                target_id=str(project.workspace_id),
                project_id=str(project.id),
            )

        db.commit()
        db.refresh(project)
        return ProjectResponse.model_validate(project, from_attributes=True)

    except Exception as e:
        db.rollback()
        return ORJSONResponse(status_code=500, content={"message": str(e)})


@router.put("/{project_id}/members/{user_id}")
def toggle_project_member(
    project_id: UUID,
    user_id: UUID,
    payload: dict = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return ORJSONResponse(
                status_code=404, content={"message": "Project not found"}
            )

        isManager = any(
            m.user_id == current_user.id and m.role == Role.manager
            for m in project.members
        )
        if not isManager:
            return ORJSONResponse(
                status_code=403,
                content={
                    "message": "You are not authorized to manage members of this project"
                },
            )

        role = payload.get("role") if payload else None
        member = next((m for m in project.members if m.user_id == user_id), None)

        if member:
            if role is None:
                if member.role == Role.manager:
                    other_managers = [
                        m
                        for m in project.members
                        if m.role == Role.manager and m.user_id != user_id
                    ]
                    if not other_managers:
                        return ORJSONResponse(
                            status_code=400,
                            content={
                                "message": "Cannot remove the last manager. Assign another manager first."
                            },
                        )

                db.delete(member)
                create_notification(
                    db,
                    user_id,
                    type="project_removed",
                    message=f"You have been removed from project '{project.title}'",
                    target_id=str(project.workspace_id),
                    project_id=str(project.id),
                )
                action = "removed"
            else:
                member.role = role
                db.add(member)
                create_notification(
                    db,
                    user_id,
                    type="project_role_updated",
                    message=f"Your role in project '{project.title}' has been updated to {role}",
                    target_id=str(project.workspace_id),
                    project_id=str(project.id),
                )
                action = "role updated"
        else:
            role = role or Role.contributor.value
            new_member = ProjectMember(
                project_id=project.id, user_id=user_id, role=role
            )
            db.add(new_member)
            create_notification(
                db,
                user_id,
                type="project_added",
                message=f"You have been added to project '{project.title}' as {role}",
                target_id=str(project.workspace_id),
                project_id=str(project.id),
            )
            action = "added"

        db.commit()
        db.refresh(project)

        return {
            "message": f"User {user_id} {action} successfully",
            "project": ProjectResponse.model_validate(project, from_attributes=True),
        }

    except Exception as e:
        db.rollback()
        return ORJSONResponse(status_code=500, content={"message": str(e)})
