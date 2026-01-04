from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.models.job import Job, JobStatus
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
    
    # Map all fields from Pydantic schema to SQLAlchemy model
    job_data = job_in.dict()
    job = Job(**job_data, admin_id=current_user.id)
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Broadcast Notification only if OPEN
    if job.status == JobStatus.OPEN:
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

@router.put("/{job_id}", response_model=job_schemas.Job)
def update_job(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
    job_in: job_schemas.JobUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a job (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Check ownership (Optional: enforcing admin ownership)
    if job.admin_id != current_user.id:
         raise HTTPException(status_code=403, detail="You can only edit jobs you posted")

    update_data = job_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.get("/", response_model=List[job_schemas.Job])
def read_jobs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    job_type: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "newest", # newest, oldest
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve jobs.
    Students: Only see 'Open' jobs.
    Admins: Can see all (Drafts, Closed), and filter by status.
    """
    query = db.query(Job)

    # Visibility Rules
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Job.status == JobStatus.OPEN)
    elif status: # Admin filtering
        query = query.filter(Job.status == status)

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
    Students cannot view Draft/Closed jobs.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if current_user.role == UserRole.STUDENT and job.status != JobStatus.OPEN:
         raise HTTPException(status_code=404, detail="Job not found") # Hide non-open jobs

    return job
