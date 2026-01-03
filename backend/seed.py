from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.review import Review
from app.models.activity_log import ActivityLog
from app.core.security import get_password_hash

def seed_data():
    db = SessionLocal()
    
    # Create Student
    student = db.query(User).filter(User.email == "student@example.com").first()
    if not student:
        student = User(
            email="student@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="John Doe",
            role=UserRole.STUDENT
        )
        db.add(student)
        print("Created student: student@example.com")

    # Create Admin
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        admin = User(
            email="admin@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Admin User",
            role=UserRole.ADMIN
        )
        db.add(admin)
        print("Created admin: admin@example.com")
        
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_data()
