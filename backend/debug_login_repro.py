from app.db.session import SessionLocal
from app.models.user import User
from app.core import security
from app.core.config import settings

def test_login():
    db = SessionLocal()
    try:
        email = "admin@example.com"
        password = "password123"
        print(f"Testing login for {email}")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print("User not found!")
            return
            
        print(f"User found: {user.email}")
        print(f"Hashed in DB: {user.hashed_password}")
        
        is_valid = security.verify_password(password, user.hashed_password)
        print(f"Password '{password}' valid? {is_valid}")
        
        if is_valid:
            token = security.create_access_token(user.id)
            print(f"Generated Token: {token}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_login()
