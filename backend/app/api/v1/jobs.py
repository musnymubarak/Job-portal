from typing import List, Any, Optional
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
        job_type=job_in.job_type,
        department=job_in.department,
        admin_id=current_user.id
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Broadcast Notification to all Students
    from app.models.notification import Notification
    
    students = db.query(User).filter(User.role == UserRole.STUDENT).all()
    notifications = []
    for student in students:
        notifications.append(Notification(
            recipient_id=student.id,
            message=f"New Job Posted: {job.title}",
            type="info"
        ))
    
    if notifications:
        db.add_all(notifications)
        db.commit()
        
    return job

@router.get("/", response_model=List[job_schemas.Job])
def read_jobs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    job_type: Optional[str] = None,
    department: Optional[str] = None,
    sort_by: Optional[str] = "newest", # newest, oldest
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve jobs. (Accessible to all authenticated users)
    Supports filtering by job_type and department.
    Supports sorting by created_at (newest/oldest).
    """
    query = db.query(Job)

    if job_type:
        query = query.filter(Job.job_type == job_type)
    if department:
        query = query.filter(Job.department == department)
    
    if sort_by == "oldest":
        query = query.order_by(Job.created_at.asc())
    else: # Default to newest
        query = query.order_by(Job.created_at.desc())

    jobs = query.offset(skip).limit(limit).all()
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
