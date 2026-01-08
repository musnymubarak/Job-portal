from fastapi import APIRouter
from app.api.v1 import auth, projects, users, jobs, applications, notifications, websockets
from app.api.v1.endpoints import password_reset, cv

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(password_reset.router, tags=["password-reset"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(websockets.router, tags=["websockets"])
api_router.include_router(cv.router, prefix="/cv", tags=["cv"])
