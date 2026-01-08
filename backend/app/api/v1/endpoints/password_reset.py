from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.password_reset import PasswordResetRequest, PasswordResetConfirm, PasswordResetResponse
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.utils.email import send_reset_password_email
from app.core.config import settings
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import secrets
import hashlib

router = APIRouter()

def generate_token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

@router.post("/password-recovery/{email}", response_model=PasswordResetResponse)
def recover_password(email: str, background_tasks: BackgroundTasks, db: Session = Depends(deps.get_db)):
    """
    Password Recovery
    """
    user = db.query(User).filter(User.email == email).first()

    # Always return 200 OK to prevent email enumeration
    if not user:
        return {"message": "If your email is registered, you will receive instructions to reset your password."}

    # Generate Token
    raw_token = secrets.token_urlsafe(32)
    token_hash = generate_token_hash(raw_token)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Save to DB
    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.add(reset_token)
    db.commit()

    # Send Email (Background Task to avoid blocking)
    background_tasks.add_task(
        send_reset_password_email,
        email_to=user.email,
        email=email,
        token=raw_token
    )

    return {"message": "If your email is registered, you will receive instructions to reset your password."}

@router.post("/reset-password", response_model=PasswordResetResponse)
def reset_password(body: PasswordResetConfirm, db: Session = Depends(deps.get_db)):
    """
    Reset Password
    """
    token_hash = generate_token_hash(body.token)
    
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # Update User Password
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
         
    user.hashed_password = get_password_hash(body.new_password)
    
    # Mark token as used
    reset_token.is_used = True
    
    # Optional: Invalidate all other active tokens for this user? 
    # For now, we just consume this one.
    
    db.commit()

    return {"message": "Password updated successfully"}
