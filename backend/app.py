from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi import FastAPI, status, HTTPException, Request
from fastapi.responses import ORJSONResponse
import os
import psycopg2 as ps
from routes import index
from database import Base, engine
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from routes.auth import limiter

load_dotenv()

app = FastAPI(default_response_class=ORJSONResponse)
app.state.limiter = limiter

# Add SlowAPI middleware
app.add_middleware(SlowAPIMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv('FRONTEND_URL')],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return ORJSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"status": 429, "success": False, "message": "Rate limit exceeded, please try again later."}
    )

# Database connection check
try:
    ps.connect(os.getenv('DATABASE_URL'))
    print("Database connection successful")
except Exception as e:
    print(e)
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database connection failed")

# Create DB tables
Base.metadata.create_all(bind=engine)

@app.get('/')
async def root():
    return {"status": status.HTTP_200_OK, "message": "Hello World!"}

# Routes
app.include_router(index.router, prefix="/api-v1")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app:app', host='127.0.0.1', port=8000, reload=True)
