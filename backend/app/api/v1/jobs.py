from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.models.job import Job
from app.schemas import job as job_schemas

router = APIRouter()

@router.post("/", response_model=job_schemas.Job)
def create_job(
    *,
    db: Session = Depends(deps.get_db),
    job_in: job_schemas.JobCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new job posting (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can post jobs",
        )
    
    job = Job(
        title=job_in.title,
        description=job_in.description,
        requirements=job_in.requirements,
        admin_id=current_user.id
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.get("/", response_model=List[job_schemas.Job])
def read_jobs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve jobs. (Accessible to all authenticated users)
    """
    jobs = db.query(Job).offset(skip).limit(limit).all()
    return jobs

@router.get("/{job_id}", response_model=job_schemas.Job)
def read_job(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get job by ID.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
