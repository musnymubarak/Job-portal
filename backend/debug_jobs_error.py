import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.job import Job, JobStatus
from app.models.user import User, UserRole

def debug_read_jobs():
    db = SessionLocal()
    try:
        print("Querying jobs...")
        # Simulate Admin Request (No filters)
        jobs = db.query(Job).all()
        print(f"Found {len(jobs)} jobs in DB.")
        
        for job in jobs:
            print(f"Job ID: {job.id}, Title: {job.title}, Status: {job.status}, Type: {type(job.status)}")
            try:
                 # Check if pydantic validation would fail
                 from app.schemas.job import Job as JobSchema
                 # Manually validate to see if it explodes
                 data = JobSchema.from_orm(job)
                 print(f"Schema Validation OK for Job {job.id}")
            except Exception as e:
                print(f"SCHEMA VALIDATION FAILED for Job {job.id}: {e}")
                import traceback
                traceback.print_exc()

    except Exception as e:
        print(f"Database Query Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_read_jobs()
