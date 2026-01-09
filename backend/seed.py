from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.job import Job, JobStatus, JobLocation
from app.models.application import Application, ApplicationStatus
from app.core.security import get_password_hash
import random

def seed_data():
    db = SessionLocal()
    
    print("WARNING: Clearing all existing data...")
    # Order matters due to foreign keys
    db.query(Application).delete()
    db.query(Job).delete()
    db.query(User).delete()
    db.commit()
    print("Data cleared.")

    password_hash = get_password_hash("password123")
    
    # 1. Create 3 Admins
    admins = []
    for i in range(1, 4):
        admin = User(
            email=f"admin{i}@example.com",
            hashed_password=password_hash,
            full_name=f"Admin User {i}",
            role=UserRole.ADMIN,
            is_active=True
        )
        admins.append(admin)
        db.add(admin)
    db.commit()
    
    # Refresh to get IDs
    for admin in admins:
        db.refresh(admin)
    print(f"Created {len(admins)} admins.")

    # 2. Create 1200 Students
    print("Creating 120 students...")
    students = []
    # Batch processing for speed
    for i in range(1, 121):
        # Format index as 001, 002... 1200
        student_id_str = f"{i:03d}" 
        email = f"2020ict{student_id_str}@stu.vau.ac.lk"
        
        student = User(
            email=email,
            hashed_password=password_hash,
            full_name=f"Student {student_id_str}",
            role=UserRole.STUDENT,
            is_active=True
        )
        students.append(student)
        
        # Batch commit every 100
        if i % 100 == 0:
            db.bulk_save_objects(students)
            db.commit()
            students = []
            print(f"  Processed {i} students...")
            
    # Commit any remaining
    if students:
        db.bulk_save_objects(students)
        db.commit()
    print("Created 120 students.")

    # 3. Create Jobs (10 per Admin)
    print("Creating Jobs...")
    departments = ["IT", "Computer Science", "Engineering", "Data Science", "Design"]
    job_titles = [
        "Software Engineer", "Frontend Developer", "Backend Developer", "Data Analyst", 
        "System Administrator", "DevOps Engineer", "QA Engineer", "UI/UX Designer",
        "Full Stack Developer", "Network Engineer"
    ]
    
    jobs = []
    for admin in admins:
        for j in range(10):
            job_title = random.choice(job_titles)
            dept = random.choice(departments)
            
            job = Job(
                title=f"{job_title}",
                description=f"We are hiring a {job_title} for our {dept} department. Apply now!",
                requirements="- Bachelor's Degree\n- Team Player\n- Problem Solving skills",
                job_type=random.choice(["Full-Time", "Part-Time", "Internship"]),
                department=dept,
                location=random.choice([JobLocation.REMOTE.value, JobLocation.ONSITE.value, JobLocation.HYBRID.value]),
                status=JobStatus.OPEN.value,
                responsibilities=["Develop software", "Collaborate with team", "Write clean code"],
                required_skills=["Python", "React", "SQL"],
                tools=["VS Code", "GitHub"],
                min_qualifications="B.Sc Hons",
                admin_id=admin.id
            )
            jobs.append(job)
    
    db.bulk_save_objects(jobs)
    db.commit()
    print(f"Created {len(jobs)} jobs (10 per admin).")

    db.close()

if __name__ == "__main__":
    seed_data()

if __name__ == "__main__":
    seed_data()
