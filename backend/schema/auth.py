from pydantic import BaseModel, EmailStr, constr
from typing import Annotated

PasswordStr = Annotated[str, constr(strip_whitespace=True, min_length=8)]
NameStr = Annotated[str, constr(strip_whitespace=True, min_length=3)]

class RegisterSchema(BaseModel):
    name: NameStr
    email: EmailStr
    password: PasswordStr
    is2FAEnabled: bool = False


class LoginSchema(BaseModel):
    email: EmailStr
    password: PasswordStr

class VerifyEmailSchema(BaseModel):
    token: str

class ResetPasswordRequestSchema(BaseModel):
    email: EmailStr

class ResetPasswordSchema(BaseModel):
    token: str
    newPassword: PasswordStr
    confirmPassword: PasswordStr
