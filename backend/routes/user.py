from fastapi import APIRouter, status, Depends
from database import get_db
from middleware.auth_middleware import get_current_user
from sqlalchemy.orm import Session
from models import User
from fastapi.responses import ORJSONResponse
from schema.user import UserSchemaOut
import bcrypt
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()


@router.get("/profile", response_model=UserSchemaOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return UserSchemaOut.model_validate(current_user, from_attributes=True)
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to fetch profile: {str(e)}"},
        )


@router.put("/updateProfile")
def updateProfile(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # Merge current user into this session
        user = db.merge(current_user)

        if "name" in payload:
            user.name = payload["name"]
        if "profilePicture" in payload:
            user.profilePicture = payload["profilePicture"]

        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.put("/updatePassword")
def updatePassword(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        currentPassword, newPassword, confirmPassword = (
            payload["currentPassword"],
            payload["newPassword"],
            payload["confirmPassword"],
        )
        if not bcrypt.checkpw(
            currentPassword.encode("utf-8"), current_user.password.encode("utf-8")
        ):
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Invalid current password"},
            )
        if newPassword != confirmPassword:
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Passwords do not match"},
            )
        if bcrypt.checkpw(
            newPassword.encode("utf-8"), current_user.password.encode("utf-8")
        ):
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "New password cannot be same as old password"},
            )

        if len(newPassword) < 8:
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Password must be at least 8 characters long"},
            )

        hashed_password = bcrypt.hashpw(
            newPassword.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        user = db.merge(current_user)
        user.password = hashed_password

        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.delete("/deleteProfile")
def deleteProfile(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        user = db.merge(current_user)
        db.delete(user)
        db.commit()
        return {"message": "Profile deleted successfully"}
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )


@router.put("/update2FA")
def update2FA(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        user = db.query(User).filter(User.id == current_user.id).first()
        user.is2FAEnabled = payload["is2FAEnabled"]
        db.commit()
        db.refresh(user)
        return {"status": 200, "is2FAEnabled": user.is2FAEnabled}
    except Exception as e:
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)},
        )
