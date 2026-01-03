from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.schemas import project as project_schemas

router = APIRouter()

@router.post("/", response_model=project_schemas.Project)
def create_project(
    *,
    db: Session = Depends(deps.get_db),
    project_in: project_schemas.ProjectCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new project (Student only).
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit projects",
        )
    
    project = Project(
        title=project_in.title,
        description=project_in.description,
        student_id=current_user.id,
        status=ProjectStatus.PENDING
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/", response_model=List[project_schemas.Project])
def read_projects(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve projects.
    - Students: View their own projects.
    - Mentors/Admins: View all projects (or filter by status).
    """
    if current_user.role == UserRole.STUDENT:
        projects = db.query(Project).filter(Project.student_id == current_user.id).offset(skip).limit(limit).all()
    else:
        projects = db.query(Project).offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=project_schemas.Project)
def read_project(
    *,
    db: Session = Depends(deps.get_db),
    project_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get project by ID.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Ownership/Permission check
    if current_user.role == UserRole.STUDENT and project.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    return project
