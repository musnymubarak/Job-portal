from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.models.student_profile import StudentProfile, PortfolioProject, StudentSkill
from app.schemas import student_profile as profile_schemas

router = APIRouter()

@router.get("/me", response_model=profile_schemas.StudentProfile)
def read_user_profile_me(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user's profile.
    """
    if current_user.role != UserRole.STUDENT and current_user.role != UserRole.ADMIN:
        # Assuming mentors might also want to see, but for now blocking if logic unclear. 
        # But actually mentors probably need to see students'. This endpoint is for ME.
        # So only if I am a student I have a student profile.
        # If I am an admin, I don't have a student profile.
        pass
        
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        # Return empty structure or 404? 
        # Usually friendly to return empty structure or create one on fly?
        # Let's return 404 to be explicit it doesn't exist yet
        raise HTTPException(status_code=404, detail="Profile not found. Please create one.")
    return profile

@router.post("/", response_model=profile_schemas.StudentProfile)
def create_user_profile(
    *,
    db: Session = Depends(deps.get_db),
    profile_in: profile_schemas.StudentProfileCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new student profile (or update if exists? No, POST is create).
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=400, detail="Only students can create a student profile")

    # Check existence
    existing_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists")

    # Create Profile
    profile = StudentProfile(
        user_id=current_user.id,
        github_url=profile_in.github_url,
        linkedin_url=profile_in.linkedin_url,
        portfolio_url=profile_in.portfolio_url
    )
    db.add(profile)
    db.flush() # get ID

    # Add Projects
    for proj in profile_in.projects:
        db_proj = PortfolioProject(
            profile_id=profile.id,
            title=proj.title,
            description=proj.description,
            link=proj.link
        )
        db.add(db_proj)

    # Add Skills
    for skill in profile_in.skills:
        db_skill = StudentSkill(
            profile_id=profile.id,
            name=skill.name,
            level=skill.level
        )
        db.add(db_skill)

    db.commit()
    db.refresh(profile)
    return profile

@router.put("/me", response_model=profile_schemas.StudentProfile)
def update_user_profile(
    *,
    db: Session = Depends(deps.get_db),
    profile_in: profile_schemas.StudentProfileUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update user profile.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        # Allow PUT to create if not exists? Standard PUT semantics.
        # For simplicity, let's say create first. 
        raise HTTPException(status_code=404, detail="Profile not found")

    # Calculate Update
    if profile_in.github_url is not None:
        profile.github_url = profile_in.github_url
    if profile_in.linkedin_url is not None:
        profile.linkedin_url = profile_in.linkedin_url
    if profile_in.portfolio_url is not None:
        profile.portfolio_url = profile_in.portfolio_url
    
    # Update Projects (Full Replacement Strategy for simplicity with lists)
    if profile_in.projects is not None:
        # Delete existing
        db.query(PortfolioProject).filter(PortfolioProject.profile_id == profile.id).delete()
        # Add new
        for proj in profile_in.projects:
            db_proj = PortfolioProject(
                profile_id=profile.id,
                title=proj.title,
                description=proj.description,
                link=proj.link
            )
            db.add(db_proj)

    # Update Skills (Full Replacement Strategy)
    if profile_in.skills is not None:
        # Delete existing
        db.query(StudentSkill).filter(StudentSkill.profile_id == profile.id).delete()
        # Add new
        for skill in profile_in.skills:
            db_skill = StudentSkill(
                profile_id=profile.id,
                name=skill.name,
                level=skill.level
            )
            db.add(db_skill)

    db.commit()
    db.refresh(profile)
    return profile

@router.get("/{user_id}", response_model=profile_schemas.StudentProfile)
def read_student_profile_by_id(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get any student's profile.
    Accessible by:
    - Admin
    - The student themselves
    - Maybe mentors/employers? (Allowing generally for now if authenticated)
    """
    # Verify user exists and is a student?
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found for this user")
        
    return profile
