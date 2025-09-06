from fastapi import APIRouter, status, Depends, Request, BackgroundTasks
from schema.auth import (
    LoginSchema,
    RegisterSchema,
    VerifyEmailSchema,
    ResetPasswordSchema,
    ResetPasswordRequestSchema,
)
from database import get_db
from sqlalchemy.orm import Session
import bcrypt
from fastapi.responses import ORJSONResponse
from mailer import generate_email
from slowapi import Limiter
from slowapi.util import get_remote_address
from utils.verify_email import full_email_check
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError  # ✅ FIXED
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
from models import User, Verification
from utils.generate_otp import generate_2FA_otp

# Load environment variables
load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("ALGORITHM")

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register")
@limiter.limit("5/minute")
async def register(
    request: Request,
    payload: RegisterSchema,
    db: Session = Depends(get_db),
    backgroundTasks: BackgroundTasks = BackgroundTasks(),
):
    try:
        email, password, name, is2FAEnabled = (
            payload.email,
            payload.password,
            payload.name,
            payload.is2FAEnabled,
        )

        # Email validation
        flags = full_email_check(email=email)
        if flags:
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "status": 400,
                    "success": False,
                    "message": "Invalid email",
                    "flags": flags,
                },
            )

        if db.query(User).filter(User.email == email).first():
            return ORJSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "status": 400,
                    "success": False,
                    "message": "User already exists",
                },
            )

        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        new_user = User(
            email=email,
            password=hashed_password,
            name=name,
            is2FAEnabled=is2FAEnabled,
        )
        db.add(new_user)
        db.flush()

        verificationToken = jwt.encode(
            {
                "userId": str(new_user.id),
                "purpose": "verify-email",
                "exp": datetime.utcnow() + timedelta(days=1),
            },
            JWT_SECRET,
            algorithm=ALGORITHM,
        )
        db_token = Verification(
            user_id=new_user.id,
            token=verificationToken,
            expires_at=datetime.utcnow() + timedelta(days=1),
        )
        db.add(db_token)
        db.flush()

        try:
            backgroundTasks.add_task(
                generate_email, verificationToken, email, "verify-email"
            )
        except Exception as mail_err:
            print(f"Email scheduling failed: {mail_err}")

        db.commit()

        return ORJSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "status": 201,
                "message": "User created successfully",
                "email_status": "Please verify your email",
            },
        )

    except Exception as e:
        db.rollback()
        return ORJSONResponse(
            status_code=500,
            content={"message": "Internal server error", "details": str(e)},
        )


# ---------------- VERIFY EMAIL ---------------- #
@router.post("/verify-email")
@limiter.limit("5/minute")
async def verify_email(
    request: Request, payload: VerifyEmailSchema, db: Session = Depends(get_db)
):
    try:
        db_token = (
            db.query(Verification).filter(Verification.token == payload.token).first()
        )
        if not db_token:
            return ORJSONResponse(
                status_code=404, content={"message": "Invalid or missing token"}
            )

        if db_token.expires_at < datetime.utcnow():
            db.delete(db_token)
            db.commit()
            return ORJSONResponse(status_code=401, content={"message": "Token expired"})

        try:
            token_data = jwt.decode(payload.token, JWT_SECRET, algorithms=[ALGORITHM])
        except ExpiredSignatureError:
            return ORJSONResponse(status_code=401, content={"message": "Token expired"})
        except InvalidTokenError:
            return ORJSONResponse(status_code=401, content={"message": "Invalid token"})

        if token_data.get("purpose") != "verify-email":
            return ORJSONResponse(
                status_code=401, content={"message": "Invalid token purpose"}
            )

        user = db.query(User).filter(User.id == db_token.user_id).first()
        if not user:
            return ORJSONResponse(
                status_code=404, content={"message": "User not found"}
            )

        if user.isEmailVerified:
            return ORJSONResponse(
                status_code=400, content={"message": "Email already verified"}
            )

        user.isEmailVerified = True
        db.delete(db_token)
        db.commit()

        return ORJSONResponse(
            status_code=200, content={"message": "Email verified successfully"}
        )

    except Exception as e:
        db.rollback()
        return ORJSONResponse(
            status_code=500,
            content={"message": "Internal server error", "error": str(e)},
        )


# ---------------- LOGIN ---------------- #
@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginSchema, db: Session = Depends(get_db)):
    email, password = payload.email, payload.password
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return ORJSONResponse(
                status_code=400, content={"message": "Invalid email or password"}
            )

        if not user.isEmailVerified:
            return ORJSONResponse(
                status_code=400,
                content={"message": "Please verify your email before logging in."},
            )

        if not bcrypt.checkpw(password.encode("utf-8"), user.password.encode("utf-8")):
            return ORJSONResponse(
                status_code=400, content={"message": "Invalid email or password"}
            )

        # ✅ 2FA
        if user.is2FAEnabled:
            otp = generate_2FA_otp()
            user.twoFAOtp = otp
            user.twoFAOtpExpires = datetime.utcnow() + timedelta(minutes=5)
            db.commit()

            try:
                generate_email(otp, user.email, "twofa-otp")
            except Exception as e:
                print(f"Failed to send OTP email: {e}")

            temp_token = jwt.encode(
                {
                    "userId": str(user.id),
                    "purpose": "2fa",
                    "exp": datetime.utcnow() + timedelta(minutes=5),
                },
                JWT_SECRET,
                algorithm=ALGORITHM,
            )

            return ORJSONResponse(
                status_code=200,
                content={
                    "message": "Two-Factor Authentication required. OTP sent to your email.",
                    "twoFactorAuth": True,
                    "token": temp_token,
                },
            )

        # Normal login
        token = jwt.encode(
            {
                "userId": str(user.id),
                "purpose": "login",
                "exp": datetime.utcnow() + timedelta(days=7),
            },
            JWT_SECRET,
            algorithm=ALGORITHM,
        )

        user.lastLogin = datetime.utcnow()
        db.commit()

        return ORJSONResponse(
            status_code=200,
            content={
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "profilePicture": user.profilePicture,
                },
            },
        )

    except Exception as e:
        db.rollback()
        print(str(e))
        return ORJSONResponse(
            status_code=500,
            content={"message": "Internal server error", "error": str(e)},
        )


# ---------------- VERIFY 2FA OTP ---------------- #
@router.post("/verify-2fa-otp")
async def verify_2fa_otp(payload: dict, db: Session = Depends(get_db)):
    try:
        temp_token = payload.get("token")
        otp = payload.get("otp")

        if not temp_token or not otp:
            return ORJSONResponse(
                status_code=400, content={"message": "Missing token or OTP"}
            )

        try:
            decoded = jwt.decode(temp_token, JWT_SECRET, algorithms=[ALGORITHM])
        except ExpiredSignatureError:
            return ORJSONResponse(
                status_code=401, content={"message": "Temporary token expired"}
            )
        except InvalidTokenError:
            return ORJSONResponse(status_code=401, content={"message": "Invalid token"})

        if decoded.get("purpose") != "2fa":
            return ORJSONResponse(
                status_code=401, content={"message": "Invalid token purpose"}
            )

        user = db.query(User).filter(User.id == decoded["userId"]).first()
        if not user:
            return ORJSONResponse(
                status_code=404, content={"message": "User not found"}
            )

        if not user.twoFAOtp or user.twoFAOtpExpires < datetime.utcnow():
            return ORJSONResponse(status_code=400, content={"message": "OTP expired"})

        if user.twoFAOtp != otp:
            return ORJSONResponse(status_code=400, content={"message": "Invalid OTP"})

        # ✅ OTP success → clear OTP and issue final login token
        user.twoFAOtp = None
        user.twoFAOtpExpires = None
        user.lastLogin = datetime.utcnow()
        db.commit()

        login_token = jwt.encode(
            {
                "userId": str(user.id),
                "purpose": "login",
                "exp": datetime.utcnow() + timedelta(days=7),
            },
            JWT_SECRET,
            algorithm=ALGORITHM,
        )

        return ORJSONResponse(
            status_code=200,
            content={
                "message": "2FA verification successful",
                "token": login_token,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "profilePicture": user.profilePicture,
                },
            },
        )

    except Exception as e:
        db.rollback()
        return ORJSONResponse(
            status_code=500,
            content={"message": "Internal server error", "error": str(e)},
        )


# ---------------- RESET PASSWORD REQUEST ---------------- #
@router.post("/reset-password-request")
@limiter.limit("5/minute")
async def resetPasswordRequest(
    request: Request,
    payload: ResetPasswordRequestSchema,
    db: Session = Depends(get_db),
    backgroundTasks: BackgroundTasks = BackgroundTasks(),
):
    email = payload.email
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return ORJSONResponse(
                status_code=404, content={"message": "User not found"}
            )

        if not user.isEmailVerified:
            return ORJSONResponse(
                status_code=400,
                content={"message": "Email not verified. Please check your inbox."},
            )

        existingVerification = (
            db.query(Verification).filter(Verification.user_id == user.id).first()
        )
        if existingVerification and existingVerification.expires_at > datetime.utcnow():
            return ORJSONResponse(
                status_code=400,
                content={
                    "message": "Reset request already sent. Please check your email."
                },
            )

        if existingVerification and existingVerification.expires_at < datetime.utcnow():
            db.delete(existingVerification)
            db.commit()

        resetPasswordtoken = jwt.encode(
            {
                "userId": str(user.id),
                "purpose": "reset-password",
                "exp": datetime.utcnow() + timedelta(minutes=15),
            },
            JWT_SECRET,
            algorithm=ALGORITHM,
        )

        newVerification = Verification(
            user_id=user.id,
            token=resetPasswordtoken,
            expires_at=datetime.utcnow() + timedelta(minutes=15),
        )
        db.add(newVerification)
        db.commit()

        try:
            backgroundTasks.add_task(
                generate_email, resetPasswordtoken, email, "reset-password"
            )
        except Exception as mail_err:
            print(f"Email scheduling failed: {mail_err}")

        return ORJSONResponse(
            status_code=200,
            content={
                "message": "Reset password request successful",
                "token": resetPasswordtoken,
            },
        )

    except Exception as e:
        db.rollback()
        return ORJSONResponse(
            status_code=500,
            content={"message": "Internal server error", "error": str(e)},
        )


# ---------------- RESET PASSWORD ---------------- #
@router.post("/reset-password")
@limiter.limit("5/minute")
async def VerifyAndResetPassword(
    request: Request, payload: ResetPasswordSchema, db: Session = Depends(get_db)
):
    try:
        token = payload.token
        new_password = payload.newPassword
        confirm_password = payload.confirmPassword

        try:
            decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        except ExpiredSignatureError:
            return ORJSONResponse(status_code=401, content={"message": "Token expired"})
        except InvalidTokenError:
            return ORJSONResponse(status_code=401, content={"message": "Invalid token"})

        if decoded_token.get("purpose") != "reset-password":
            return ORJSONResponse(status_code=401, content={"message": "Unauthorized"})

        verification = (
            db.query(Verification)
            .filter(
                Verification.token == token,
                Verification.user_id == decoded_token["userId"],
            )
            .first()
        )
        if not verification:
            return ORJSONResponse(status_code=401, content={"message": "Unauthorized"})

        if verification.expires_at < datetime.utcnow():
            return ORJSONResponse(status_code=401, content={"message": "Token expired"})

        user = db.query(User).filter(User.id == verification.user_id).first()
        if not user:
            return ORJSONResponse(
                status_code=404, content={"message": "User not found"}
            )

        if new_password != confirm_password:
            return ORJSONResponse(
                status_code=400, content={"message": "Passwords do not match"}
            )

        user.password = bcrypt.hashpw(
            new_password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")
        db.delete(verification)
        db.commit()

        return ORJSONResponse(
            status_code=200, content={"message": "Password reset successful"}
        )

    except Exception as e:
        db.rollback()
        return ORJSONResponse(
            status_code=500,
            content={"message": "Internal server error", "error": str(e)},
        )
