from fastapi import APIRouter, status, Depends, UploadFile, File, Query
from fastapi.responses import ORJSONResponse, FileResponse
from database import get_db
from middleware.auth_middleware import get_current_user
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from models import User, Project, Workspace, Task, ActivityLog, Comment
from models.notifications import Notification
from schema.task import TaskBaseResponse, UserLiteResponse
from utils.activity import record_activity
from datetime import datetime
from uuid import uuid4
from sqlalchemy.orm.attributes import flag_modified
from models.activity_log import ActionType, ResourceType
from typing import List
import os
import shutil
import json

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/{project_id}/create-task")
def createTask(
    payload: dict,
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        payload = payload["values"]
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Project not found"},
            )

        workspace = (
            db.query(Workspace).filter(Workspace.id == project.workspace_id).first()
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

        title, description, statu_val, priority, due_date, assignees = (
            payload.get("title"),
            payload.get("description"),
            payload["status"],
            payload.get("priority"),
            payload.get("due_date"),
            payload.get("assignees", []),
        )

        new_task = Task(
            title=title,
            description=description,
            status=statu_val,
            priority=priority,
            due_date=due_date,
            project_id=project_id,
            created_by=current_user.id,
        )
        db.add(new_task)
        db.flush()

        if assignees:
            user = db.query(User).filter(User.id.in_(assignees)).all()
            new_task.assignees = user
            for u in user:
                if u.id == current_user.id:
                    continue
                db.add(
                    Notification(
                        user_id=u.id,
                        type="task_assigned",
                        message=f"Task '{title}' has been assigned to you",
                        link=f"/workspaces/{workspace.id}/projects/{project.id}/tasks/{new_task.id}",
                    )
                )

        db.commit()
        db.refresh(new_task)
        return new_task

    except Exception as e:
        print("IN EXCEPTION BLOCK", e)
        db.rollback()
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.get("/mytasks")
def getMyTasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        if not current_user:
            return ORJSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"message": "Unauthorized"},
            )

        tasks = (
            db.query(Task)
            .options(
                joinedload(Task.assignees),
                joinedload(Task.project).joinedload(Project.workspace),
            )
            .filter(Task.assignees.any(User.id == current_user.id))
            .order_by(Task.created_at.desc())
            .all()
        )

        results: List[dict] = []

        for task in tasks:
            results.append(
                {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "project_id": task.project_id,
                    "status": task.status.value if task.status else None,
                    "priority": task.priority.value if task.priority else None,
                    "watchers": task.watchers or [],
                    "tags": task.tags or [],
                    "subtasks": task.subtasks or [],
                    "attachments": task.attachments or [],
                    "due_date": task.due_date,
                    "completed_at": task.completed_at,
                    "estimated_hours": task.estimated_hours,
                    "actual_hours": task.actual_hours,
                    "created_by": task.created_by,
                    "is_archived": task.is_archived,
                    "created_at": task.created_at,
                    "updated_at": task.updated_at,
                    "assignees": [
                        {
                            "id": u.id,
                            "name": u.name,
                            "profile_picture": u.profilePicture,
                        }
                        for u in task.assignees
                    ],
                    "project": {
                        "id": task.project.id if task.project else None,
                        "title": task.project.title if task.project else None,
                        "workspace": task.project.workspace.name
                        if task.project
                        else None,
                    }
                    if task.project
                    else None,
                }
            )

        return results

    except Exception as e:
        print("Error in get_my_tasks:", str(e))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "Internal server error"},
        )


@router.get("/{task_id}")
def getTask(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        watchers = []
        if task.watchers:
            watchers_obj = db.query(User).filter(User.id.in_(task.watchers)).all()
            watchers = [
                UserLiteResponse(id=w.id, name=w.name, profile_picture=w.profilePicture)
                for w in watchers_obj
            ]

        assignees = [
            UserLiteResponse(id=a.id, name=a.name, profile_picture=a.profilePicture)
            for a in task.assignees
        ]

        # Deserialize attachments if stored as JSON string
        attachments = []
        if task.attachments:
            try:
                if isinstance(task.attachments, str):
                    attachments = json.loads(task.attachments)
                else:
                    attachments = task.attachments

                # normalize structure
                normalized_attachments = []
                for att in attachments:
                    normalized_attachments.append(
                        {
                            "id": att.get("id"),
                            "file_name": att.get("fileName", "unknown.txt"),
                            "file_url": att.get("fileUrl", ""),
                            "uploaded_at": att.get(
                                "uploadedAt", task.updated_at or task.created_at
                            ),
                        }
                    )
                attachments = normalized_attachments
            except Exception:
                attachments = []

        task_response = TaskBaseResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            project_id=task.project_id,
            status=task.status,
            priority=task.priority,
            watchers=[w.id for w in watchers],
            tags=task.tags,
            subtasks=task.subtasks,
            attachments=attachments,  # ✅ fixed here
            due_date=task.due_date,
            completed_at=task.completed_at,
            estimated_hours=task.estimated_hours,
            actual_hours=task.actual_hours,
            created_by=task.created_by,
            is_archived=task.is_archived,
            created_at=task.created_at,
            updated_at=task.updated_at,
            assignees=assignees,
        )

        project = db.query(Project).filter(Project.id == task.project_id).first()
        project_data = None
        if project:
            members = [
                UserLiteResponse(
                    id=m.user_id,
                    name=m.user.name,
                    profile_picture=m.user.profilePicture,
                )
                for m in project.members
            ]
            project_data = {"id": project.id, "name": project.title, "members": members}

        return {"task": task_response, "project": project_data}

    except Exception as e:
        print(str(e))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.put("/{task_id}/title")
def updateTaskTitle(
    task_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        isMember = any(m.user_id == current_user.id for m in task.project.members)
        if not isMember:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not a member of this project"},
            )

        oldTitle = task.title
        task.title = payload["title"]

        record_activity(
            db,
            current_user.id,
            ActionType.updated_task,
            ResourceType.task,
            task_id,
            {"description": f"Task title updated from {oldTitle} to {task.title}"},
        )
        db.commit()
        db.refresh(task)
        return task
    except Exception as e:
        print(str(e))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.put("/{task_id}/description")
def updateTaskDescription(
    task_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        isMember = any(m.user_id == current_user.id for m in task.project.members)
        if not isMember:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not a member of this project"},
            )

        task.description = payload["description"]

        record_activity(
            db,
            current_user.id,
            ActionType.updated_task,
            ResourceType.task,
            task_id,
            {"description": "Task description updated."},
        )
        db.commit()
        db.refresh(task)
        return task
    except Exception as e:
        print(str(e))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.put("/{task_id}/status")
def updateTaskStatus(
    task_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        isMember = any(m.user_id == current_user.id for m in task.project.members)
        if not isMember:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not a member of this project"},
            )
        if task.subtasks:
            for subtask in task.subtasks:
                if not subtask.get("completed"):
                    return ORJSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={"message": "Subtasks are not completed"},
                    )
                break

        oldStatus = task.status
        task.status = payload["status"]

        record_activity(
            db,
            current_user.id,
            ActionType.updated_task,
            ResourceType.task,
            task_id,
            {"description": f"Task status updated to {task.status} from {oldStatus}"},
        )
        db.commit()
        db.refresh(task)
        return task
    except Exception as e:
        print(str(e))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.put("/{task_id}/assignees")
def updateTaskAssignees(
    task_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        isMember = any(m.user_id == current_user.id for m in task.project.members)
        if not isMember:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not a member of this project"},
            )

        assigneesIds = payload.get("assignees", [])
        assignees = db.query(User).filter(User.id.in_(assigneesIds)).all()
        task.assignees = assignees

        for u in assignees:
            if u.id == current_user.id:
                continue
            db.add(
                Notification(
                    user_id=u.id,
                    type="task_assigned",
                    message=f"You have been assigned to a task: {task.title}",
                    link=f"/tasks/{task.id}",
                )
            )

        record_activity(
            db,
            current_user.id,
            ActionType.updated_task,
            ResourceType.task,
            task_id,
            {"description": "Task assignees updated."},
        )
        db.commit()
        db.refresh(task)
        return task
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.put("/{task_id}/priority")
def updateTaskPriority(
    task_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        isMember = any(m.user_id == current_user.id for m in task.project.members)
        if not isMember:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not a member of this project"},
            )

        oldPriority = task.priority
        task.priority = payload["priority"]

        record_activity(
            db,
            current_user.id,
            ActionType.updated_task,
            ResourceType.task,
            task_id,
            {
                "description": f"Task priority updated to {task.priority} from {oldPriority}"
            },
        )
        db.commit()
        db.refresh(task)
        return task
    except Exception as e:
        print(str(e))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.post("/{task_id}/create-subtask")
def add_subtask(
    task_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ORJSONResponse(
                status_code=404, content={"message": "Task not found"}
            )

        project = db.query(Project).filter(Project.id == task.project_id).first()
        if not project:
            return ORJSONResponse(
                status_code=404, content={"message": "Project not found"}
            )

        is_member = any(m.user_id == current_user.id for m in project.members)
        if not is_member:
            return ORJSONResponse(
                status_code=403,
                content={"message": "You are not a member of this project"},
            )

        new_subtask = {
            "id": str(uuid4()),
            "title": payload.get("title"),
            "completed": False,
            "created_at": datetime.utcnow().isoformat(),
        }

        task.subtasks = (task.subtasks or []) + [new_subtask]

        record_activity(
            db,
            current_user.id,
            ActionType.created_subtask,
            ResourceType.task,
            task_id,
            {"description": f"Subtask '{new_subtask['title']}' created"},
        )

        db.commit()
        db.refresh(task)
        return ORJSONResponse(
            status_code=201,
            content={"message": "Subtask created", "subtasks": task.subtasks},
        )
    except Exception as e:
        print(str(e))
        return ORJSONResponse(status_code=500, content={"message": str(e)})


@router.put("/{task_id}/update-subtask")
def update_subtask(
    task_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ORJSONResponse(
                status_code=404, content={"message": "Task not found"}
            )

        is_member = any(m.user_id == current_user.id for m in task.project.members)
        if not is_member:
            return ORJSONResponse(
                status_code=403,
                content={"message": "You are not a member of this project"},
            )

        subtask_id = payload.get("subtaskId")
        if not subtask_id:
            return ORJSONResponse(
                status_code=400, content={"message": "subtaskId is required"}
            )

        updated = False
        for st in task.subtasks or []:
            if str(st["id"]) == str(subtask_id) and not st.get("completed", False):
                st["completed"] = payload["completed"]
                st["updated_at"] = datetime.utcnow().isoformat()
                updated = True
                break

        if not updated:
            return ORJSONResponse(
                status_code=404, content={"message": "Subtask not found"}
            )

        flag_modified(task, "subtasks")

        record_activity(
            db,
            current_user.id,
            ActionType.updated_subtask,
            ResourceType.task,
            task_id,
            {"description": f"Subtask {subtask_id} updated"},
        )

        db.commit()
        db.refresh(task)
        return ORJSONResponse(
            status_code=200,
            content={"message": "Subtask updated", "subtasks": task.subtasks},
        )

    except Exception as e:
        print(str(e))
        db.rollback()
        return ORJSONResponse(status_code=500, content={"message": str(e)})


@router.get("/{resourceId}/activity")
def getActivity(
    resourceId: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        activity_logs = (
            db.query(ActivityLog)
            .options(joinedload(ActivityLog.user))
            .filter(ActivityLog.resource_id == resourceId)
            .order_by(ActivityLog.created_at.desc())
            .all()
        )
        return activity_logs
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.post("/{task_id}/add-comment")
def addComment(
    task_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = (
            db.query(Task)
            .options(joinedload(Task.project).joinedload(Project.members))
            .filter(Task.id == task_id)
            .first()
        )
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        if not task.project:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Project not found"},
            )

        isMember = any(m.user_id == current_user.id for m in task.project.members)
        if not isMember:
            return ORJSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"message": "You are not a member of this project"},
            )

        comment = Comment(
            id=uuid4(),
            task_id=task_id,
            author_id=current_user.id,
            text=payload.get("text"),
            created_at=datetime.utcnow(),
        )
        db.add(comment)
        record_activity(
            db,
            current_user.id,
            ActionType.added_comment,
            ResourceType.task,
            task_id,
            {
                "description": f"added comment {comment.text[:50]}{'...' if len(comment.text) > 50 else ''}"
            },
        )
        db.commit()
        db.refresh(comment)

        return comment
    except Exception as e:
        db.rollback()
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.get("/{task_id}/comments")
def getComments(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        comments = (
            db.query(Comment)
            .options(joinedload(Comment.author))
            .filter(Comment.task_id == task_id)
            .order_by(Comment.created_at.desc())
            .all()
        )
        return comments
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.post("/{task_id}/archived")
def archiveTask(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = (
            db.query(Task)
            .options(joinedload(Task.project).joinedload(Project.members))
            .filter(Task.id == task_id)
            .first()
        )
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        project = task.project
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

        was_archived = task.is_archived
        task.is_archived = not was_archived
        db.add(task)

        record_activity(
            db,
            current_user.id,
            ActionType.updated_task,
            ResourceType.task,
            task_id,
            {
                "description": f"{'unarchived' if was_archived else 'archived'} task {task.title}"
            },
        )
        db.commit()
        db.refresh(task)

        return task

    except Exception as e:
        db.rollback()
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.post("/{task_id}/watch")
def watchTask(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = (
            db.query(Task)
            .options(joinedload(Task.project).joinedload(Project.members))
            .filter(Task.id == task_id)
            .first()
        )
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        project = task.project
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

        user_id = str(current_user.id)
        if user_id not in (task.watchers or []):
            task.watchers.append(user_id)
            action_desc = f"started watching task {task.title}"
        else:
            task.watchers = [w for w in task.watchers if w != user_id]
            action_desc = f"stopped watching task {task.title}"

        db.add(task)

        record_activity(
            db,
            current_user.id,
            ActionType.updated_task,
            ResourceType.task,
            task_id,
            {"description": action_desc},
        )
        db.commit()
        db.refresh(task)
        return ORJSONResponse(status_code=status.HTTP_200_OK)

    except Exception as e:
        db.rollback()
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.post("/{task_id}/attachments")
def add_attachments(
    task_id: UUID,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        current_attachments = task.attachments or []

        for file in files:
            file_id = str(uuid4())  # unique id for each attachment
            file_location = f"{UPLOAD_DIR}/{file_id}_{file.filename}"
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            file_size = os.path.getsize(file_location)
            attachment = {
                "id": file_id,
                "file_name": file.filename,
                "file_url": file_location,
                "file_type": file.content_type,
                "file_size": file_size,
                "uploaded_by": str(current_user.id),
                "uploaded_at": datetime.utcnow().isoformat(),
            }
            current_attachments.append(attachment)

            record_activity(
                db,
                current_user.id,
                ActionType.added_attachment,
                ResourceType.task,
                task_id,
                {
                    "description": f"added attachment {file.filename} to task {task.title}"
                },
            )

        task.attachments = current_attachments
        db.commit()
        db.refresh(task)

        return {
            "message": "Attachments added successfully",
            "attachments": task.attachments,
        }

    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.delete("/{task_id}/attachments")
def delete_attachments(
    task_id: UUID,
    attachment_ids: List[str] = Query(..., description="List of attachment IDs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        current_attachments = task.attachments or []
        updated_attachments = [
            a for a in current_attachments if a["id"] not in attachment_ids
        ]
        deleted = [a for a in current_attachments if a["id"] in attachment_ids]

        if not deleted:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "No matching attachments found"},
            )

        task.attachments = updated_attachments

        for att in deleted:
            record_activity(
                db,
                current_user.id,
                ActionType.removed_attachment,
                ResourceType.task,
                task_id,
                {
                    "description": f"deleted attachment {att['fileName']} from task {task.title}"
                },
            )

        db.commit()
        db.refresh(task)

        return {
            "message": "Attachments deleted successfully",
            "attachments": task.attachments,
        }

    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.get("/{task_id}/attachments")
def get_attachments(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ORJSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"},
            )

        return task.attachments

    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.get("/attachments/download/{saved_file_name}")
def download_attachment(saved_file_name: str):
    file_path = os.path.join(UPLOAD_DIR, saved_file_name)

    if not os.path.exists(file_path):
        return ORJSONResponse(
            status_code=404, content={"message": f"File {saved_file_name} not found"}
        )
    original_file_name = "_".join(saved_file_name.split("_")[1:]) or saved_file_name

    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=original_file_name,
    )
