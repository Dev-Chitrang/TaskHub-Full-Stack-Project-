from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status, Depends
from fastapi.responses import ORJSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User
from models.notifications import Notification
from typing import List, Dict
from middleware.auth_middleware import get_current_user
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
active_connections: Dict[str, List[WebSocket]] = {}


def authenticate_websocket_token(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=[os.getenv("ALGORITHM")])
        user_id: str = payload.get("userId")
        if user_id is None:
            return None

        user = db.query(User).filter(User.id == user_id).first()
        return user
    except jwt.PyJWTError:
        return None


async def send_notification_to_user(user_id: str, notification_data: dict):
    if user_id in active_connections:
        # Send to all connections for this user (multiple tabs/devices)
        connections_to_remove = []
        for connection in active_connections[user_id]:
            try:
                await connection.send_json(notification_data)
            except:
                # Connection is broken, mark for removal
                connections_to_remove.append(connection)

        # Remove broken connections
        for connection in connections_to_remove:
            try:
                active_connections[user_id].remove(connection)
            except ValueError:
                pass

        # Clean up empty user connections
        if not active_connections[user_id]:
            del active_connections[user_id]


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        return (
            db.query(Notification)
            .filter(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .all()
        )
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.post("/{notif_id}/mark-read")
def mark_as_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notif_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        return ORJSONResponse(
            status_code=404, content={"message": "Notification not found"}
        )
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.delete("/{notif_id}")
def delete_notification(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notif_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        return ORJSONResponse(
            status_code=404, content={"message": "Notification not found"}
        )
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted"}


@router.websocket("/ws")
async def websocket_notifications(
    websocket: WebSocket, token: str, db: Session = Depends(get_db)
):
    # Authenticate the token
    user = authenticate_websocket_token(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    user_id = str(user.id)

    # Add connection to active connections
    if user_id not in active_connections:
        active_connections[user_id] = []
    active_connections[user_id].append(websocket)

    try:
        while True:
            # Keep the connection alive by receiving messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        # Clean up when client disconnects
        if user_id in active_connections:
            try:
                active_connections[user_id].remove(websocket)
                # Remove user from active connections if no connections left
                if not active_connections[user_id]:
                    del active_connections[user_id]
            except ValueError:
                # Connection already removed
                pass
