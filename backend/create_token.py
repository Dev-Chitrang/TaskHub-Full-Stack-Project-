import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

def create_verification_token(user_id: int):
    payload = {
        "userId": user_id,
        "purpose": "email-verification",
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    token = jwt.encode(payload, os.getenv("JWT_SECRET"), os.getenv("ALGORITHM"))
    return token