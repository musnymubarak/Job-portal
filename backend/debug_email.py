import sys
import os
import logging
import secrets

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging to see output from app.utils.email
logging.basicConfig(level=logging.INFO)

from app.db.session import SessionLocal
from app.models.user import User
from app.utils.email import send_reset_password_email

def test_specific_user_email():
    print("--- Test Specific User Email ---")
    target_email = "2020ict110@stu.vau.ac.lk"
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == target_email).first()
        if not user:
            print(f"User with email {target_email} NOT FOUND in database.")
            return

        print(f"Found user: {user.email} (ID: {user.id})")
        
        # Simulate token
        raw_token = secrets.token_urlsafe(32)
        print(f"Generated dummy token: {raw_token}")
        
        print(f"Attempting to send reset email to {target_email}...")
        try:
            send_reset_password_email(
                email_to=user.email,
                email=target_email,
                token=raw_token
            )
            print("send_reset_password_email executed successfully.")
        except Exception as e:
            print(f"Failed to send email: {e}")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_specific_user_email()
