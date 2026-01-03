from typing import Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.schemas import user as user_schemas
import shutil
import os
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/me", response_model=user_schemas.User)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.post("/upload-cv", response_model=user_schemas.User)
async def upload_cv(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload CV (PDF only).
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Generate safe filename: using user ID to avoid collisions/overwriting
    filename = f"user_{current_user.id}_cv.pdf"
    file_path = UPLOAD_DIR / filename
    
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not save file")
    
    # Update user profile
    current_user.cv_filename = filename
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/cv/{user_id}")
def get_user_cv(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get path to user CV. 
    - Students can only see their own.
    - Admins can see anyone's.
    """
    # ... Implementation for file download/serving would go here
    # For now, we will serve static files via a mounted static directory in main.py
    pass
