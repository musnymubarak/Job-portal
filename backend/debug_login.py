from app.db.session import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.review import Review
from app.models.activity_log import ActivityLog
from app.core.security import verify_password
from app.core.config import settings

def debug_login():
    db = SessionLocal()
    email = "student@example.com"
    password = "password123"
    
    print(f"Checking user: {email}")
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        print("ERROR: User not found in database.")
        return

    print(f"User found: ID={user.id}, Role={user.role}")
    print(f"Stored Hash: {user.hashed_password}")
    
    is_valid = verify_password(password, user.hashed_password)
    if is_valid:
        print("SUCCESS: Password 'password123' verifies correctly against the hash.")
    else:
        print("FAILURE: Password verification failed.")
        # Try to re-hash to see what it should look like
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        new_hash = pwd_context.hash(password)
        print(f"Expected (New) Hash example: {new_hash}")

if __name__ == "__main__":
    debug_login()
