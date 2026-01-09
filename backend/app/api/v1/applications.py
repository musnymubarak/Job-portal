from sqlalchemy.orm import Session, joinedload
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from app.api import deps
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.application import Application, ApplicationStatus
from app.schemas import application as application_schemas
from pdfminer.high_level import extract_text
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("uploads")

def calculate_ats_score(job_description: str, job_requirements: str, cv_path: Path) -> float:
    """
    Real ATS Scoring Logic using PDFMiner.
    1. Extract text from PDF.
    2. Extract keywords from Job Requirements (simple split).
    3. Calculate match percentage.
    """
    try:
        # Extract text from CV
        if not cv_path.exists():
            print(f"CV Path not found: {cv_path}")
            return 0.0
            
        cv_text = extract_text(cv_path).lower()
        
        # Prepare keywords from Requirements (simple approach: split by commas/spaces)
        # In a real app, use NLP (spacy/nltk) to extract nouns/skills
        keywords = [k.strip().lower() for k in job_requirements.replace(",", " ").split() if len(k) > 2]
        keywords += [k.strip().lower() for k in job_description.replace(",", " ").split() if len(k) > 4] # Add some long words from desc
        
        if not keywords:
            return 50.0 # Default if no keywords found

        unique_keywords = set(keywords)
        matched_count = 0
        for keyword in unique_keywords:
            if keyword in cv_text:
                matched_count += 1
        
        score = (matched_count / len(unique_keywords)) * 100
        
        # Boost score slightly if description words found, clamp to 100
        return round(min(score * 1.2, 100.0), 1)

    except Exception as e:
        print(f"ATS Calculation Error: {e}")
        return 0.0

@router.post("/{job_id}/apply", response_model=application_schemas.Application)
def apply_for_job(
    *,
    db: Session = Depends(deps.get_db),
    job_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Apply for a job (Student only).
    Requires a CV to be uploaded first.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can apply for jobs",
        )
    
    if not current_user.cv_filename:
        raise HTTPException(
            status_code=400,
            detail="You must upload a CV to your profile before applying.",
        )

    # Check if job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if already applied
    existing_application = db.query(Application).filter(
        Application.job_id == job_id,
        Application.student_id == current_user.id
    ).first()
    if existing_application:
        raise HTTPException(status_code=400, detail="You have already applied for this job")

    # Calculate ATS Score
    cv_full_path = UPLOAD_DIR / current_user.cv_filename
    ats_score = calculate_ats_score(job.description, job.requirements, cv_full_path)

    application = Application(
        job_id=job_id,
        student_id=current_user.id,
        cv_snapshot_path=current_user.cv_filename,
        ats_score=ats_score,
        status=ApplicationStatus.APPLIED
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    # Broadcast to Admin through WebSockets
    from app.core.manager import manager
    msg = {
        "event": "application_submitted",
        "data": {
            "job_id": job_id,
            "job_title": job.title,
            "student_name": current_user.full_name,
            "application_id": application.id
        }
    }
    background_tasks.add_task(manager.broadcast, msg)
    
    return application

@router.get("/admin/list", response_model=List[application_schemas.Application])
def list_applications_admin(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    job_id: Optional[int] = None,
    min_score: Optional[float] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "date_desc",
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    List all applications (Admin only).
    Optional: Filter by job_id.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(Application).join(Job).options(joinedload(Application.student), joinedload(Application.job))
    
    # Restrict to jobs posted by this admin
    query = query.filter(Job.admin_id == current_user.id)
    
    if job_id:
        query = query.filter(Application.job_id == job_id)
        
    if status and status != 'all':
        query = query.filter(Application.status == status)
        
    if min_score is not None:
        query = query.filter(Application.ats_score >= min_score)
        
    if sort_by == "score_desc":
        query = query.order_by(Application.ats_score.desc())
    elif sort_by == "date_asc":
        query = query.order_by(Application.created_at.asc())
    else: # Default: date_desc (newest first)
        query = query.order_by(Application.created_at.desc())
        
    applications = query.offset(skip).limit(limit).all()
    return applications

@router.get("/my-applications", response_model=List[application_schemas.Application])
def list_my_applications(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    List my applications (Student).
    """
    applications = db.query(Application).options(joinedload(Application.job)).filter(Application.student_id == current_user.id).all()
    return applications

@router.put("/{application_id}/status", response_model=application_schemas.Application)
def update_application_status(
    *,
    db: Session = Depends(deps.get_db),
    application_id: int,
    status_update: application_schemas.ApplicationUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Update application status (Admin only).
    Triggers a notification for the student.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    application = db.query(Application).join(Job).filter(
        Application.id == application_id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Check if the job belongs to this admin
    if application.job.admin_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this application")
        
    old_status = application.status
    application.status = status_update.status
    db.add(application)
    
    # Create Notification
    from app.models.notification import Notification
    
    message = f"Your application for {application.job.title} has been updated to: {status_update.status.value.upper()}."
    notification_type = "info"
    if status_update.status == ApplicationStatus.ACCEPTED:
        message = f"Congratulations! Your application for {application.job.title} has been ACCEPTED!"
        notification_type = "success"
    elif status_update.status == ApplicationStatus.REJECTED:
        notification_type = "error" # or warning
        
    notification = Notification(
        recipient_id=application.student_id,
        message=message,
        type=notification_type
    )
    db.add(notification)
    
    db.commit()
    db.refresh(application)
    
    # Broadcast through WebSockets
    from app.core.manager import manager
    from fastapi.encoders import jsonable_encoder
    
    msg = {
        "event": "status_updated",
        "data": {
            "application_id": application.id,
            "status": application.status,
            "job_id": application.job_id,
            "student_id": application.student_id
        }
    }
    background_tasks.add_task(manager.broadcast, msg)
    
    return application
