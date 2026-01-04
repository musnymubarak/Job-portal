import sys
import os
import random
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.job import Job, JobStatus, JobLocation
from app.models.application import Application
from app.models.notification import Notification
from app.models.activity_log import ActivityLog
from app.core.security import get_password_hash

# Data Lists for variety
TITLES = ["Software Engineer", "Frontend Developer", "Backend Developer", "Data Scientist", "Product Manager", "UI/UX Designer", "DevOps Engineer", "QA Engineer", "Mobile Developer", "Full Stack Developer"]
SKILLS = ["Python", "React", "TypeScript", "FastAPI", "Docker", "AWS", "SQL", "NoSQL", "Figma", "Kubernetes", "Java", "C++", "Go", "TensorFlow"]
LOCATIONS = ["New York, NY", "San Francisco, CA", "Remote", "London, UK", "Berlin, DE", "Austin, TX"]

def clear_database(db):
    print("Clearing database...")
    db.query(Notification).delete()
    db.query(ActivityLog).delete()
    db.query(Application).delete()
    db.query(Job).delete()
    db.query(User).delete()
    db.commit()
    print("Database cleared.")

def create_users_and_jobs(db):
    print("Seeding data...")
    pwd_hash = get_password_hash("password123")
    
    admins = []
    # Create 3 Admins
    for i in range(1, 4):
        admin = User(
            email=f"admin{i}@example.com",
            hashed_password=pwd_hash,
            full_name=f"Admin User {i}",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        admins.append(admin)
    db.commit() # Commit to get IDs
    for a in admins: db.refresh(a)
    print(f"Created {len(admins)} admins.")

    # Create 100 Students
    students = []
    for i in range(1, 101):
        student = User(
            email=f"student{i}@example.com",
            hashed_password=pwd_hash,
            full_name=f"Student User {i}",
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(student)
        students.append(student)
    
    # Commit in batches if needed, but 100 is small enough
    db.commit()
    print(f"Created {len(students)} students.")

    # Create Jobs (10 per Admin)
    jobs = []
    for admin in admins:
        for j in range(1, 11):
            title = random.choice(TITLES)
            status = JobStatus.OPEN if j <= 8 else JobStatus.DRAFT # Mostly Open
            location_type = random.choice(list(JobLocation))
            
            job = Job(
                title=f"{title} {j} ({admin.full_name})",
                description=f"This is a detailed description for {title} position. exciting opportunity...",
                requirements="Bachelor's degree in CS or related field.",
                job_type="Full-time" if random.random() > 0.5 else "Internship",
                department="Engineering",
                location=location_type.value, # Using the Enum value for location field
                duration="6 months" if "Internship" in title else "Permanent",
                deadline=datetime.now() + timedelta(days=random.randint(5, 60)),
                status=status,
                admin_id=admin.id,
                responsibilities=["Write code", "Review PRs", "Attend meetings", "Fix bugs"],
                required_skills=random.sample(SKILLS, k=3),
                preferred_skills=random.sample(SKILLS, k=2),
                tools=["Jira", "Slack", "Git"],
                min_qualifications="BsC in Computer Science"
            )
            db.add(job)
            jobs.append(job)
    
    db.commit()
    print(f"Created {len(jobs)} jobs (10 per admin).")

def seed():
    db = SessionLocal()
    try:
        clear_database(db)
        create_users_and_jobs(db)
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
