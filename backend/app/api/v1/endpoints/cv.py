from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from pathlib import Path

router = APIRouter()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.get("/download/{student_id}")
def download_cv(
    student_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Download a student's CV.
    Accessible by: Admin, or the Student themselves.
    """
    if current_user.role != UserRole.ADMIN and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if not student.cv_filename:
        raise HTTPException(status_code=404, detail="Student has not uploaded a CV")
        
    try:
        from app.utils.supabase import supabase
        # Create a signed URL valid for 1 hour (3600 seconds)
        response = supabase.storage.from_("cvs").create_signed_url(student.cv_filename, 3600)
        # response is usually a dict or object containing 'signedURL'
        # The python client returns a response object where .get('signedURL') works or it's a direct string?
        # Checking docs/common usage: create_signed_url returns a dict like {'signedURL': '...'} or just the string depending on version.
        # Let's assume it returns a dict or check source if possible.
        # Safest approach: Inspect payload or use .get if dict. 
        # Actually, standard supabase-py returns dict: {'signedURL': '...'}
        if isinstance(response, dict) and "signedURL" in response:
            return {"url": response["signedURL"]}
        elif hasattr(response, "signedURL"): # Some versions
             return {"url": response.signedURL}
        else:
             # Fallback if it returns raw string (unlikely but possible)
             return {"url": str(response)}

    except Exception as e:
        print(f"Supabase Sign URL Error: {e}")
        raise HTTPException(status_code=404, detail="CV file not found in cloud storage")
