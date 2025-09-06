from models.activity_log import ActivityLog
from fastapi.responses import ORJSONResponse
from fastapi import status

def record_activity(db, userId, action, resourceType, resourceId, details):
    try:
        activity = ActivityLog(
            user_id=userId,
            action=action,
            resource_type=resourceType,
            resource_id=resourceId,
            details=details,
        )
        db.add(activity)
        return activity
    except Exception as e:
        return ORJSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"message": str(e)})